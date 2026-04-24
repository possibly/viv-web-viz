// Engine: ties the live runtime to our snapshot history. Steps the sim forward,
// captures a Snapshot each frame.

import {
    emptyHostState, loadViv, makeAdapter, seedDemoWorld, snapshotHostState,
    type HostState, type Snapshot, type VivRuntime,
} from "./viv";

const TIMESTEP_DELTA = 10;

export type Engine = {
    runtime: VivRuntime;
    live: HostState;                    // mutable — held by reference inside adapter closures
    snapshots: Snapshot[];              // append-only history
    schemaVersion: string;
    sourceCode: string | null;          // optional .viv source, shown read-only
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

    // Frame 0: the initial world state, AFTER the seed plan has been queued.
    const snapshots: Snapshot[] = [snapshotHostState(live, 0, [])];

    const stepOnce = async (): Promise<Snapshot> => {
        const prevActions = [...live.actions];
        for (const cid of live.characters) {
            await runtime.selectAction({ initiatorID: cid });
        }
        live.timestamp += TIMESTEP_DELTA;
        // Fade memory salience according to elapsed story time, so decay is visible in the UI.
        try { await runtime.fadeCharacterMemories(); } catch { /* no-op if unsupported */ }
        const snap = snapshotHostState(live, snapshots.length, prevActions);
        snapshots.push(snap);
        return snap;
    };

    const stepMany = async (n: number): Promise<Snapshot[]> => {
        const out: Snapshot[] = [];
        for (let i = 0; i < n; i++) out.push(await stepOnce());
        return out;
    };

    return {
        runtime,
        live,
        snapshots,
        schemaVersion: runtime.getSchemaVersion(),
        sourceCode: init.sourceCode ?? null,
        stepOnce,
        stepMany,
    };
}
