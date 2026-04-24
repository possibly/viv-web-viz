// Thin wrapper around the vendored Viv browser runtime.
//
// The runtime lives at /vendor/viv-runtime.js (copied from viv/runtimes/js/dist/index.browser.js).
// We load it at runtime via dynamic import so the bundler doesn't try to resolve bare specifiers
// inside the pre-bundled artifact.
//
// The runtime keeps global singleton state (one initialized runtime per page). To explore past
// timesteps we capture a deep clone of the simulation state after each step; "scrubbing" is
// read-only replay of those snapshots, not a time-travel of the runtime itself.

// A sifting match is a mapping from action-role names to arrays of action IDs.
export type SiftingMatch = Record<string, string[]>;

export type VivRuntime = {
    initializeVivRuntime: (args: { contentBundle: unknown; adapter: unknown }) => true;
    vivRuntimeIsInitialized: () => boolean;
    selectAction: (args: { initiatorID: string }) => Promise<string | null>;
    queuePlan: (args: {
        planName: string;
        urgent?: boolean;
        precastBindings?: Record<string, string[]>;
        causes?: string[];
    }) => Promise<string>;
    runSearchQuery: (args: {
        queryName: string;
        searchDomain?: string;
        precastBindings?: Record<string, string[]>;
    }) => Promise<string[]>;
    runSiftingPattern: (args: {
        patternName: string;
        searchDomain?: string;
        precastBindings?: Record<string, string[]>;
    }) => Promise<SiftingMatch | null>;
    constructSiftingMatchDiagram: (args: {
        siftingMatch: SiftingMatch;
        ansi?: boolean;
    }) => Promise<string>;
    tickPlanner: () => Promise<void>;
    fadeCharacterMemories: () => Promise<void>;
    getDebuggingData: () => Promise<unknown>;
    getSchemaVersion: () => string;
    EntityType: { Character: string; Item: string; Location: string; Action: string };
};

let cached: Promise<VivRuntime> | null = null;

export function loadViv(): Promise<VivRuntime> {
    if (!cached) {
        // The vendored bundle has no type declarations of its own; we treat it as any.
        cached = (import("../vendor/viv-runtime.js" as any)) as Promise<VivRuntime>;
    }
    return cached;
}

// --- Host state & adapter ---------------------------------------------------

export type EntityID = string;
export type Entity = Record<string, unknown> & { id: EntityID; name?: string; entityType: string };

export type HostState = {
    timestamp: number;
    entities: Record<EntityID, Entity>;
    characters: EntityID[];
    locations: EntityID[];
    items: EntityID[];
    actions: EntityID[];
    vivInternalState: unknown;
};

export function emptyHostState(): HostState {
    return {
        timestamp: 0,
        entities: {},
        characters: [],
        locations: [],
        items: [],
        actions: [],
        vivInternalState: null,
    };
}

const setIn = (obj: any, path: string | string[], value: unknown) => {
    const parts = Array.isArray(path) ? path : String(path).split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
        cur = cur[k];
    }
    cur[parts[parts.length - 1]] = value;
};

// `crypto.randomUUID` requires a secure context (HTTPS or localhost). When accessed over
// plain HTTP on a LAN/Tailscale IP, it's undefined — fall back to a getRandomValues-based
// UUID v4 generator, which is available in any modern browser regardless of context.
const randomUUID: () => string =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? () => crypto.randomUUID()
        : () => {
            const b = crypto.getRandomValues(new Uint8Array(16));
            b[6] = (b[6] & 0x0f) | 0x40;
            b[8] = (b[8] & 0x3f) | 0x80;
            const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
            return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
        };

export function makeAdapter(state: HostState, EntityType: VivRuntime["EntityType"]) {
    return {
        provisionActionID: () => randomUUID(),
        getEntityView: (id: string) => {
            if (state.entities[id] === undefined) throw new Error(`no entity: ${id}`);
            return structuredClone(state.entities[id]);
        },
        getEntityLabel: (id: string) => {
            if (state.entities[id] === undefined) throw new Error(`no entity: ${id}`);
            return (state.entities[id] as any).name;
        },
        updateEntityProperty: (id: string, path: string, value: unknown) => {
            if (state.entities[id] === undefined) throw new Error(`no entity: ${id}`);
            setIn(state.entities[id], path, value);
        },
        saveActionData: (id: string, data: any) => {
            if (state.entities[id] === undefined) state.actions.push(id);
            state.entities[id] = data;
        },
        getCurrentTimestamp: () => state.timestamp,
        getEntityIDs: (type: string, locationID?: string) => {
            if (locationID) {
                if (type === EntityType.Character) {
                    return state.characters.filter((id) => (state.entities[id] as any).location === locationID);
                }
                if (type === EntityType.Item) {
                    return state.items.filter((id) => (state.entities[id] as any).location === locationID);
                }
                throw new Error(`invalid type for location query: ${type}`);
            }
            switch (type) {
                case EntityType.Character: return [...state.characters];
                case EntityType.Item: return [...state.items];
                case EntityType.Location: return [...state.locations];
                case EntityType.Action: return [...state.actions];
                default: throw new Error(`invalid entity type: ${type}`);
            }
        },
        getVivInternalState: () => structuredClone(state.vivInternalState),
        saveVivInternalState: (s: unknown) => { state.vivInternalState = structuredClone(s); },
        saveCharacterMemory: (characterID: string, actionID: string, memory: unknown) => {
            ((state.entities[characterID] as any).memories ??= {})[actionID] = memory;
        },
        saveItemInscriptions: (itemID: string, inscriptions: unknown) => {
            (state.entities[itemID] as any).inscriptions = inscriptions;
        },
        // Aggressive decay config so memory salience visibly falls across ~5 ticks
        // (= 5 weeks of story time). Defaults are tuned for monthly timescales,
        // which is invisible at our per-week tick cadence.
        config: {
            memoryRetentionMonthlyMultiplier: 0.15,
            memoryForgettingSalienceThreshold: 0.5,
            memoryMaxSalience: 10,
        },
        debug: { validateAPICalls: true, watchlists: {} },
    };
}

// Default demo world matching the hello-viv example.
export function seedDemoWorld(state: HostState, EntityType: VivRuntime["EntityType"]) {
    const locationID = "tavern";
    state.locations.push(locationID);
    state.entities[locationID] = {
        entityType: EntityType.Location,
        id: locationID,
        name: "The Tavern",
    };
    for (const [id, name] of [["alice", "Alice"], ["bob", "Bob"], ["carol", "Carol"]]) {
        state.characters.push(id);
        state.entities[id] = {
            entityType: EntityType.Character,
            id,
            name,
            location: locationID,
            mood: 0,
            memories: {},
        };
    }
}

// Snapshot capture/restore ---------------------------------------------------

// Per-character record of selectAction's outcome during a step.
export type CharSelection = {
    characterID: string;
    characterName: string;
    // "from-queue": the character had an action already queued on their
    //   actionQueue (from a plan phase or a reaction) and selectAction
    //   dispatched it. "free-pick": no queued action — the runtime's action
    //   selector chose an action freshly. "none": no action produced at all.
    source: "from-queue" | "free-pick" | "none";
    actionID: string | null;   // UID of the action produced, if any
    gloss: string | null;      // gloss/report for quick display
};

// Snapshot of a live plan just after tickPlanner has run: name and current phase,
// for display in the step digest. Lets users see "scheme-revenge now in >plot".
export type ActivePlanSummary = { id: string; name: string; phase: string };

export type StepDigest = {
    // tickPlanner phase
    plansActiveBefore: number;
    plansActiveAfter: number;
    plansQueuedBefore: number;
    plansQueuedAfter: number;
    activePlansAfter: ActivePlanSummary[];  // plans still in flight after the tick
    // selectAction phase
    selections: CharSelection[];
    // derived totals
    plansLaunched: number;     // plansQueuedBefore - plansQueuedAfter, clamped ≥ 0
    plansResolved: number;     // plansActiveBefore ↦ gone from activePlans (approximation)
    fromQueueCount: number;
    freePickCount: number;
    newActionCount: number;
};

// Monotonically growing list of plans we've ever observed by this frame.
// Held separately from state so the UI can surface resolved plans that the
// runtime has already removed from its live planQueue/activePlans maps.
export type SnapshotPlanRosterEntry = {
    id: string;
    name: string;
    precastBindings: Record<string, string[]>;
    firstSeenFrame: number;
};

// Same idea for queued reactions (per-character action queues): we need to
// remember the action name and bindings so the "Recently resolved" list can
// label them after they've been drained.
export type SnapshotReactionRosterEntry = {
    id: string;
    name: string;
    initiatorID: string;
    initiatorName: string;
    precastBindings: Record<string, string[]>;
    firstSeenFrame: number;
};

export type Snapshot = {
    frame: number;            // 0-indexed step count
    timestamp: number;        // story-time timestamp at the END of this frame
    state: HostState;         // deep clone, immutable from the UI's perspective
    newActionIDs: string[];   // actions produced during this step
    digest: StepDigest | null; // what happened during the step that produced this frame (null on frame 0)
    planRoster: SnapshotPlanRosterEntry[]; // every plan ever observed up to this frame
    reactionRoster: SnapshotReactionRosterEntry[]; // every reaction-queued action ever observed
};

export function snapshotHostState(
    state: HostState,
    frame: number,
    prevActions: string[],
    digest: StepDigest | null,
    planRoster: SnapshotPlanRosterEntry[],
    reactionRoster: SnapshotReactionRosterEntry[],
): Snapshot {
    const cloned: HostState = structuredClone(state);
    const prevSet = new Set(prevActions);
    const newActionIDs = cloned.actions.filter((id) => !prevSet.has(id));
    return {
        frame,
        timestamp: cloned.timestamp,
        state: cloned,
        newActionIDs,
        digest,
        planRoster: planRoster.slice(),
        reactionRoster: reactionRoster.slice(),
    };
}
