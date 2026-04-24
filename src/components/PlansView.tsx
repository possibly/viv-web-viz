import type { Snapshot } from "../lib/viv";
import { DocsLink } from "./DocsLink";

// The runtime's `planQueue` only holds plans that haven't yet been targeted;
// `activePlans` holds ones currently underway; once a plan resolves it's removed
// from both. To keep the UI informative, the engine records every plan UID it
// has ever seen on the snapshot's `planRoster`, and we classify each one by
// looking it up in the live maps + the status dict.

type Status = "pending" | "succeeded" | "failed" | string;

function StatusBadge({ status }: { status: Status }) {
    const color =
        status === "succeeded" ? "var(--good)"
        : status === "failed" ? "var(--err)"
        : status === "pending" || status === "active" ? "var(--warn)"
        : "var(--muted)";
    return <span className="tag" style={{ color, borderColor: color }}>{status}</span>;
}

function bindingsLine(precast: Record<string, any> | undefined) {
    if (!precast) return null;
    const entries = Object.entries(precast);
    if (entries.length === 0) return null;
    return entries.map(([role, ids]: [string, any]) =>
        `@${role}=${Array.isArray(ids) ? ids.join(",") : ids}`
    ).join(" · ");
}

export function PlansView({ snapshot }: { snapshot: Snapshot }) {
    const internal = snapshot.state.vivInternalState as any;
    if (!internal) {
        return <><h2>Plans <DocsLink k="plans" /></h2><div className="empty">no runtime state in this snapshot</div></>;
    }

    const statuses: Record<string, Status> = internal.queuedConstructStatuses ?? {};
    const planQueue: any[] = internal.planQueue ?? [];
    const activePlans: Record<string, any> = internal.activePlans ?? {};

    const queuedIDs = new Set(planQueue.map((p) => p?.id).filter(Boolean));
    const activeIDs = new Set(Object.keys(activePlans));

    // Classify everything in the roster. Roster entries not in planQueue or
    // activePlans must have already resolved — use the status dict if it has
    // a terminal status, otherwise best guess "resolved".
    const roster = snapshot.planRoster ?? [];
    const pending = roster.filter((p) => queuedIDs.has(p.id));
    const active = roster
        .filter((p) => activeIDs.has(p.id))
        .map((p) => ({ ...p, plan: activePlans[p.id] }));
    const resolved = roster.filter((p) => !queuedIDs.has(p.id) && !activeIDs.has(p.id));

    const summary = `${pending.length} queued · ${active.length} active · ${resolved.length} resolved`;

    return (
        <>
            <h2>Plans <DocsLink k="plans" /></h2>
            <div className="sub" style={{ color: "var(--muted)", marginBottom: "0.6rem" }}>{summary}</div>

            <h3>Active ({active.length})</h3>
            {active.length === 0 ? (
                <div className="empty">no plans currently underway</div>
            ) : active.map(({ id, name, plan }) => {
                const phaseName = plan?.currentPhase ?? plan?.currentPhaseName ?? plan?.phaseName ?? plan?.phase ?? "?";
                const phasesDone = plan?.completedPhases ?? plan?.resolvedPhases;
                const bindings = bindingsLine(plan?.roleBindings ?? plan?.bindings ?? plan?.precastBindings);
                return (
                    <div key={id} className="row">
                        <div>
                            <span className="tag">plan</span>
                            <b>{name}</b>
                            <StatusBadge status="active" />
                        </div>
                        <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                            phase: <b style={{ color: "var(--accent)" }}>{phaseName}</b>
                            {Array.isArray(phasesDone) ? ` · done: [${phasesDone.join(", ")}]` : ""}
                        </div>
                        {bindings ? (
                            <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                                {bindings}
                            </div>
                        ) : null}
                        <details style={{ marginTop: "0.35rem" }}>
                            <summary className="sub" style={{ color: "var(--muted)", cursor: "pointer", fontSize: "0.78rem" }}>
                                raw
                            </summary>
                            <pre className="json">{JSON.stringify(plan, null, 2)}</pre>
                        </details>
                    </div>
                );
            })}

            <h3>Queued ({pending.length})</h3>
            {pending.length === 0 ? (
                <div className="empty">no pending plans</div>
            ) : pending.map((p) => (
                <div key={p.id} className="row">
                    <div>
                        <span className="tag">plan</span>
                        <b>{p.name}</b>
                        <StatusBadge status="pending" />
                    </div>
                    {bindingsLine(p.precastBindings) ? (
                        <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                            {bindingsLine(p.precastBindings)}
                        </div>
                    ) : null}
                </div>
            ))}

            <h3>Resolved ({resolved.length})</h3>
            {resolved.length === 0 ? (
                <div className="empty">no plans have resolved yet</div>
            ) : resolved.map((p) => {
                const status = statuses[p.id] ?? "resolved";
                return (
                    <div key={p.id} className="row">
                        <div>
                            <span className="tag">plan</span>
                            <b>{p.name}</b>
                            <StatusBadge status={status} />
                            <span className="meta mono" style={{ marginLeft: "0.3rem", fontSize: "0.72rem" }}>
                                seen at f{p.firstSeenFrame}
                            </span>
                        </div>
                        {bindingsLine(p.precastBindings) ? (
                            <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                                {bindingsLine(p.precastBindings)}
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </>
    );
}
