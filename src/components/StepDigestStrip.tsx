import type { Snapshot, StepDigest } from "../lib/viv";

// Per-frame "what ran" strip. Labels the actual runtime API call sequence so
// users learn the pipeline by watching it happen:
//
//   tickPlanner() → selectAction × N → fadeCharacterMemories()
//
// Frame 0 has no digest (no step has run yet) and the strip is suppressed.

function PlansSummary({ d }: { d: StepDigest }) {
    const qDelta = d.plansQueuedAfter - d.plansQueuedBefore;
    const aDelta = d.plansActiveAfter - d.plansActiveBefore;
    const pieces: string[] = [];
    if (d.plansLaunched > 0) pieces.push(`launched ${d.plansLaunched}`);
    if (d.plansResolved > 0) pieces.push(`resolved ${d.plansResolved}`);
    if (pieces.length === 0) pieces.push("no change");
    return (
        <span>
            <span style={{ color: "var(--muted)" }}>{pieces.join(" · ")}</span>
            {" "}
            <span className="mono" style={{ color: "var(--muted)", fontSize: "0.72rem" }}>
                (queue {d.plansQueuedBefore}
                {qDelta !== 0 ? `→${d.plansQueuedAfter}` : ""},
                {" "}active {d.plansActiveBefore}
                {aDelta !== 0 ? `→${d.plansActiveAfter}` : ""})
            </span>
            {d.activePlansAfter.length > 0 ? (
                <span className="mono" style={{ color: "var(--accent)", fontSize: "0.78rem", marginLeft: "0.35rem" }}>
                    {" · in flight: "}
                    {d.activePlansAfter.map((p, i) => (
                        <span key={p.id}>
                            {i > 0 ? ", " : ""}
                            <b>{p.name}</b>
                            <span style={{ color: "var(--muted)" }}>@</span>
                            <span style={{ color: "var(--accent-2)" }}>{p.phase}</span>
                        </span>
                    ))}
                </span>
            ) : null}
        </span>
    );
}

function SelectionsSummary({ d }: { d: StepDigest }) {
    if (d.selections.length === 0) return <span style={{ color: "var(--muted)" }}>no characters</span>;
    const abbrev = (src: "from-queue" | "free-pick" | "none") =>
        src === "from-queue" ? "q" : src === "free-pick" ? "f" : "—";
    return (
        <span>
            <b style={{ color: "var(--good)" }} title="actions pulled from a character's action queue (queued by a plan phase or a prior reaction)">
                {d.fromQueueCount} from queue
            </b>
            {" · "}
            <b style={{ color: "var(--accent)" }} title="actions chosen freshly by the action selector, with no prior queue entry">
                {d.freePickCount} free pick
            </b>
            {" "}
            <span className="mono" style={{ color: "var(--muted)", fontSize: "0.72rem" }}>
                (
                {d.selections.map((s, i) => (
                    <span key={s.characterID}>
                        {i > 0 ? ", " : ""}
                        {s.characterName}:{abbrev(s.source)}
                    </span>
                ))}
                )
            </span>
        </span>
    );
}

export function StepDigestStrip({ snapshot }: { snapshot: Snapshot }) {
    const d = snapshot.digest;
    if (!d) {
        return (
            <div className="step-strip">
                <span className="meta" style={{ fontStyle: "italic" }}>
                    frame 0 · initial world state · no step has run yet
                </span>
            </div>
        );
    }
    return (
        <div className="step-strip">
            <div className="step-strip-row">
                <span className="step-api mono">tickPlanner()</span>
                <span className="step-arrow">→</span>
                <PlansSummary d={d} />
            </div>
            <div className="step-strip-row">
                <span className="step-api mono">selectAction × {d.selections.length}</span>
                <span className="step-arrow">→</span>
                <SelectionsSummary d={d} />
                <span className="mono" style={{ color: "var(--muted)", marginLeft: "0.4rem" }}>
                    · {d.newActionCount} new action{d.newActionCount === 1 ? "" : "s"}
                </span>
            </div>
            <div className="step-strip-row">
                <span className="step-api mono">fadeCharacterMemories()</span>
                <span className="step-arrow">→</span>
                <span style={{ color: "var(--muted)" }}>all characters' salience faded one tick</span>
            </div>
        </div>
    );
}
