import type { Snapshot } from "../lib/viv";
import { DocsLink } from "./DocsLink";

// internal.planQueue      — queued plans not yet started
// internal.activePlans    — plans currently underway, keyed by plan UID
// internal.queuedConstructStatuses[planUID] — 'pending' | 'succeeded' | 'failed'

type Status = "pending" | "succeeded" | "failed" | string;

function StatusBadge({ status }: { status: Status }) {
    const color =
        status === "succeeded" ? "var(--good)"
        : status === "failed" ? "var(--err)"
        : status === "pending" ? "var(--warn)"
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

    const pending = planQueue.filter((p) => statuses[p?.id] === "pending" || statuses[p?.id] === undefined);
    const active = Object.entries(activePlans);
    const succeeded = planQueue.filter((p) => statuses[p?.id] === "succeeded");
    const failed = planQueue.filter((p) => statuses[p?.id] === "failed");

    return (
        <>
            <h2>Plans <DocsLink k="plans" /></h2>
            <div className="sub" style={{ color: "var(--muted)", marginBottom: "0.6rem" }}>
                {pending.length} queued · {active.length} active · {succeeded.length} succeeded · {failed.length} failed
            </div>

            <h3>Active ({active.length})</h3>
            {active.length === 0 ? (
                <div className="empty">no plans currently underway</div>
            ) : active.map(([pid, plan]: [string, any]) => {
                const phaseName = plan?.currentPhaseName ?? plan?.phaseName ?? plan?.phase ?? "?";
                const phasesDone = plan?.completedPhases ?? plan?.resolvedPhases;
                const bindings = bindingsLine(plan?.roleBindings ?? plan?.precastBindings);
                return (
                    <div key={pid} className="row">
                        <div>
                            <span className="tag">plan</span>
                            <b>{plan?.planName ?? plan?.constructName ?? "?"}</b>
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
            ) : pending.map((p: any) => (
                <div key={p?.id} className="row">
                    <div>
                        <span className="tag">plan</span>
                        <b>{p?.constructName ?? "?"}</b>
                        <StatusBadge status="pending" />
                        {p?.urgent ? <span className="tag" style={{ color: "var(--accent)" }}>urgent</span> : null}
                    </div>
                    {bindingsLine(p?.precastBindings) ? (
                        <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                            {bindingsLine(p.precastBindings)}
                        </div>
                    ) : null}
                </div>
            ))}

            {succeeded.length + failed.length > 0 ? (
                <>
                    <h3>Resolved ({succeeded.length + failed.length})</h3>
                    {[...succeeded.map((p: any) => ["succeeded", p] as const),
                      ...failed.map((p: any) => ["failed", p] as const)].map(([st, p]) => (
                        <div key={p?.id} className="row">
                            <div>
                                <span className="tag">plan</span>
                                <b>{p?.constructName ?? "?"}</b>
                                <StatusBadge status={st} />
                            </div>
                            {bindingsLine(p?.precastBindings) ? (
                                <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                                    {bindingsLine(p.precastBindings)}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </>
            ) : null}
        </>
    );
}
