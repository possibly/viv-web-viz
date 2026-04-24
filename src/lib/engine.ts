// Engine: ties the live runtime to our snapshot history. Steps the sim forward,
// captures a Snapshot each frame.

import {
    emptyHostState, loadViv, makeAdapter, seedDemoWorld, snapshotHostState,
    type HostState, type Snapshot, type VivRuntime,
    type CharSelection, type StepDigest, type ActivePlanSummary,
} from "./viv";

// Minimal view of a role's definition ("as: character" etc.) pulled from the bundle.
export type PatternMeta = {
    name: string;
    roles: Record<string, { as?: string }>;
};

export type QueryMeta = { name: string };

// A record of every plan instance we've ever observed (in planQueue or
// activePlans). Once a plan succeeds or fails, the runtime removes it from
// those live maps — but the UI still needs to show it happened. The roster
// lets us do that by holding onto the identifying metadata.
export type PlanRosterEntry = {
    id: string;
    name: string;
    precastBindings: Record<string, string[]>;
    firstSeenFrame: number;
};

export type PlanRoster = PlanRosterEntry[];

// Story time is measured in minutes. We advance 1 week per tick so that
// plan-wait periods and memory decay land on scrub-friendly timescales.
const TIMESTEP_DELTA = 60 * 24 * 7; // 10080 minutes = 1 week

export type Engine = {
    runtime: VivRuntime;
    live: HostState;                    // mutable — held by reference inside adapter closures
    snapshots: Snapshot[];              // append-only history
    schemaVersion: string;
    sourceCode: string | null;          // optional .viv source, shown read-only
    patterns: PatternMeta[];            // sifting patterns defined in the bundle
    queries: QueryMeta[];               // search queries defined in the bundle
    stepOnce: () => Promise<Snapshot>;  // advance one frame, return the new snapshot
    stepMany: (n: number) => Promise<Snapshot[]>;
};

export type EngineInit = {
    contentBundle: unknown;
    sourceCode?: string | null;
    seedWorld?: (state: HostState, EntityType: VivRuntime["EntityType"]) => void;
};

export async function createEngine(init: EngineInit): Promise<Engine> {
    const runtime = await loadViv();
    const live = emptyHostState();
    const adapter = makeAdapter(live, runtime.EntityType);
    runtime.initializeVivRuntime({ contentBundle: init.contentBundle, adapter });

    (init.seedWorld ?? seedDemoWorld)(live, runtime.EntityType);

    // Seed a plan so the Plans + Queues tabs have something to show out of the box.
    // Best-effort: if the bundle doesn't define `befriend`, we silently skip.
    if (live.characters.length >= 3) {
        try {
            await runtime.queuePlan({
                planName: "befriend",
                precastBindings: {
                    host: [live.characters[0]],
                    guest_a: [live.characters[1]],
                    guest_b: [live.characters[2]],
                },
            });
        } catch { /* plan not present in this bundle */ }
    }

    // Monotonically growing list of every plan we've ever observed. Seeded
    // from the post-init state so plans queued at init appear in frame 0's
    // roster too.
    const planRoster: PlanRoster = [];
    const recordPlansInState = (frame: number) => {
        const internal = live.vivInternalState as any;
        const seen = new Set(planRoster.map((p) => p.id));
        const from = (arr: any[] | undefined, fallbackName = "?") => {
            for (const p of arr ?? []) {
                const id = p?.id; if (!id || seen.has(id)) continue;
                planRoster.push({
                    id,
                    name: p?.constructName ?? p?.planName ?? fallbackName,
                    precastBindings: p?.precastBindings ?? {},
                    firstSeenFrame: frame,
                });
                seen.add(id);
            }
        };
        from(internal?.planQueue);
        const active = internal?.activePlans ?? {};
        for (const [id, plan] of Object.entries(active as Record<string, any>)) {
            if (seen.has(id)) continue;
            planRoster.push({
                id,
                name: (plan as any)?.planName ?? (plan as any)?.constructName ?? "?",
                precastBindings: (plan as any)?.precastBindings ?? (plan as any)?.roleBindings ?? {},
                firstSeenFrame: frame,
            });
            seen.add(id);
        }
    };
    recordPlansInState(0);

    // Mirror roster for reaction-queued actions, so "Recently resolved" can
    // label them (name, initiator, bindings) after they've been drained from
    // the live actionQueues map.
    const reactionRoster: { id: string; name: string; initiatorID: string; initiatorName: string; precastBindings: Record<string, string[]>; firstSeenFrame: number }[] = [];
    const recordReactionsInState = (frame: number) => {
        const internal = live.vivInternalState as any;
        const seen = new Set(reactionRoster.map((r) => r.id));
        const qs = internal?.actionQueues ?? {};
        for (const [initiatorID, q] of Object.entries(qs as Record<string, any[]>)) {
            for (const c of q ?? []) {
                const id = c?.id;
                if (!id || seen.has(id)) continue;
                reactionRoster.push({
                    id,
                    name: c?.constructName ?? c?.actionName ?? "?",
                    initiatorID,
                    initiatorName: characterLabel(initiatorID),
                    precastBindings: c?.precastBindings ?? c?.bindings ?? {},
                    firstSeenFrame: frame,
                });
                seen.add(id);
            }
        }
    };
    recordReactionsInState(0);

    // Frame 0: the initial world state, AFTER the seed plan has been queued.
    const snapshots: Snapshot[] = [snapshotHostState(live, 0, [], null, planRoster, reactionRoster)];

    // Helpers for reading the Viv internal state between runtime calls, so we can
    // attribute each selection to a queued action vs. a free action and count plan
    // transitions for the per-step digest.
    const planQueueSize = () => ((live.vivInternalState as any)?.planQueue ?? []).length;
    const activePlansCount = () => Object.keys((live.vivInternalState as any)?.activePlans ?? {}).length;
    const actionQueueFor = (cid: string): any[] => {
        const qs = (live.vivInternalState as any)?.actionQueues ?? {};
        return qs[cid] ?? [];
    };
    const characterLabel = (cid: string) => (live.entities[cid] as any)?.name ?? cid;

    const stepOnce = async (): Promise<Snapshot> => {
        const prevActions = [...live.actions];

        // 1. tickPlanner — targets queued plans, greedily executes their phases
        //    onto per-character action queues (and resumes active plans).
        const plansQueuedBefore = planQueueSize();
        const plansActiveBefore = activePlansCount();
        await runtime.tickPlanner();
        const plansQueuedAfter = planQueueSize();
        const plansActiveAfter = activePlansCount();

        // 2. selectAction per character — each one dispatches a pre-queued
        //    action off their actionQueue if there is one, otherwise picks a
        //    free-selectable action. We peek at the queue before the call to
        //    classify the outcome for the digest strip.
        const selections: CharSelection[] = [];
        for (const cid of live.characters) {
            const hadQueuedBefore = actionQueueFor(cid).length > 0;
            const actionsBefore = new Set(live.actions);
            await runtime.selectAction({ initiatorID: cid });
            const newIDs = live.actions.filter((id) => !actionsBefore.has(id));
            const actionID = newIDs[newIDs.length - 1] ?? null;
            const actionEntity = actionID ? (live.entities[actionID] as any) : null;
            const gloss = actionEntity?.report ?? actionEntity?.gloss ?? null;
            selections.push({
                characterID: cid,
                characterName: characterLabel(cid),
                source: actionID == null ? "none" : (hadQueuedBefore ? "from-queue" : "free-pick"),
                actionID,
                gloss,
            });
        }

        // 3. Advance story time and fade memory salience so decay is visible.
        live.timestamp += TIMESTEP_DELTA;
        try { await runtime.fadeCharacterMemories(); } catch { /* no-op if unsupported */ }

        const fromQueueCount = selections.filter((s) => s.source === "from-queue").length;
        const freePickCount = selections.filter((s) => s.source === "free-pick").length;

        // Update both rosters with anything new that appeared across this tick.
        recordPlansInState(snapshots.length);
        recordReactionsInState(snapshots.length);

        const activePlansAfter: ActivePlanSummary[] = Object.entries(
            (live.vivInternalState as any)?.activePlans ?? {},
        ).map(([id, p]: [string, any]) => ({
            id,
            name: p?.planName ?? p?.constructName ?? "?",
            phase: p?.currentPhase ?? p?.currentPhaseName ?? p?.phaseName ?? p?.phase ?? "?",
        }));

        const digest: StepDigest = {
            plansActiveBefore,
            plansActiveAfter,
            plansQueuedBefore,
            plansQueuedAfter,
            activePlansAfter,
            selections,
            plansLaunched: Math.max(0, plansActiveAfter - plansActiveBefore),
            plansResolved: Math.max(0, plansActiveBefore - plansActiveAfter),
            fromQueueCount,
            freePickCount,
            newActionCount: live.actions.length - prevActions.length,
        };

        const snap = snapshotHostState(live, snapshots.length, prevActions, digest, planRoster, reactionRoster);
        snapshots.push(snap);
        return snap;
    };

    const stepMany = async (n: number): Promise<Snapshot[]> => {
        const out: Snapshot[] = [];
        for (let i = 0; i < n; i++) out.push(await stepOnce());
        return out;
    };

    const bundleAny = init.contentBundle as any;
    const patterns: PatternMeta[] = Object.entries(bundleAny?.siftingPatterns ?? {})
        .map(([name, def]: [string, any]) => ({ name, roles: def?.roles ?? {} }));
    const queries: QueryMeta[] = Object.keys(bundleAny?.queries ?? {})
        .map((name) => ({ name }));

    return {
        runtime,
        live,
        snapshots,
        schemaVersion: runtime.getSchemaVersion(),
        sourceCode: init.sourceCode ?? null,
        patterns,
        queries,
        stepOnce,
        stepMany,
    };
}
