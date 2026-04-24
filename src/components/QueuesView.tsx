import type { Snapshot } from "../lib/viv";
import { DocsLink } from "./DocsLink";

// Viv internal state shape (observed empirically):
//   actionQueues: { [initiatorID]: QueuedConstruct[] }    — per-character action queues
//   planQueue:    QueuedConstruct[]                        — the planner's FIFO plan queue
//   queuedConstructStatuses: { [uid]: 'pending'|'succeeded'|'failed' }
//
// We join those together so the view shows "what's queued right now" alongside
// "what has been queued and since resolved."

type Status = "pending" | "succeeded" | "failed" | string;

function StatusBadge({ status }: { status: Status }) {
    const color =
        status === "succeeded" ? "var(--good)"
        : status === "failed" ? "var(--err)"
        : status === "pending" ? "var(--warn)"
        : "var(--muted)";
    return <span className="tag" style={{ color, borderColor: color }}>{status}</span>;
}

function ConstructCard({ c, status }: { c: any; status?: Status }) {
    const precast = c?.precastBindings ?? {};
    const bindings = Object.entries(precast)
        .map(([role, ids]: [string, any]) => `@${role}=${Array.isArray(ids) ? ids.join(",") : ids}`)
        .join(" · ");
    return (
        <div className="row">
            <div>
                <span className="tag">{c?.type ?? "construct"}</span>
                <b>{c?.constructName ?? c?.actionName ?? "?"}</b>
                {status ? <> <StatusBadge status={status} /></> : null}
                {c?.urgent ? <span className="tag" style={{ color: "var(--accent)" }}>urgent</span> : null}
            </div>
            {bindings ? (
                <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                    {bindings}
                </div>
            ) : null}
            {c?.id ? (
                <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "0.2rem" }}>
                    {c.id}
                </div>
            ) : null}
        </div>
    );
}

export function QueuesView({ snapshot }: { snapshot: Snapshot }) {
    const internal = snapshot.state.vivInternalState as any;
    if (!internal) {
        return <><h2>Queues <DocsLink k="queues" /></h2><div className="empty">no runtime state in this snapshot</div></>;
    }

    const statuses: Record<string, Status> = internal.queuedConstructStatuses ?? {};
    const actionQueues: Record<string, any[]> = internal.actionQueues ?? {};
    const planQueue: any[] = internal.planQueue ?? [];

    const pendingActionCount = Object.values(actionQueues).reduce((n, q) => n + (q?.length ?? 0), 0);
    const pendingPlans = planQueue.filter((p) => statuses[p?.id] !== "succeeded" && statuses[p?.id] !== "failed");

    // History: every construct we've ever seen a status for, minus the ones still in live queues.
    const liveIDs = new Set<string>();
    for (const q of Object.values(actionQueues)) for (const c of q ?? []) if (c?.id) liveIDs.add(c.id);
    for (const p of planQueue) if (p?.id) liveIDs.add(p.id);
    const resolvedIDs = Object.entries(statuses)
        .filter(([id, st]) => !liveIDs.has(id) && (st === "succeeded" || st === "failed"));

    return (
        <>
            <h2>Queues <DocsLink k="queues" /></h2>
            <div className="sub" style={{ color: "var(--muted)", marginBottom: "0.6rem" }}>
                Live: {pendingActionCount} queued action{pendingActionCount === 1 ? "" : "s"},
                {" "}{pendingPlans.length} queued plan{pendingPlans.length === 1 ? "" : "s"}.
                Resolved: {resolvedIDs.length}.
            </div>

            <h3>Action queues by initiator</h3>
            {Object.keys(actionQueues).length === 0 ? (
                <div className="empty">no per-character action queues</div>
            ) : Object.entries(actionQueues).map(([cid, q]) => (
                <div key={cid} style={{ marginBottom: "0.6rem" }}>
                    <div className="mono" style={{ color: "var(--accent)", fontSize: "0.85rem" }}>
                        {cid} — {q?.length ?? 0} queued
                    </div>
                    {(q?.length ?? 0) === 0 ? (
                        <div className="empty" style={{ fontSize: "0.85rem" }}>empty</div>
                    ) : q.map((c: any) => (
                        <ConstructCard key={c?.id ?? Math.random()} c={c} status={statuses[c?.id]} />
                    ))}
                </div>
            ))}

            <h3>Plan queue</h3>
            {planQueue.length === 0 ? (
                <div className="empty">no queued plans</div>
            ) : planQueue.map((p: any) => (
                <ConstructCard key={p?.id ?? Math.random()} c={p} status={statuses[p?.id]} />
            ))}

            <h3>Recently resolved</h3>
            {resolvedIDs.length === 0 ? (
                <div className="empty">none yet — step the simulation</div>
            ) : resolvedIDs.map(([id, st]) => (
                <div key={id} className="row">
                    <div><StatusBadge status={st} /></div>
                    <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.72rem" }}>{id}</div>
                </div>
            ))}
        </>
    );
}
