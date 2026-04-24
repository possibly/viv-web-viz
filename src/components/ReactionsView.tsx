import type { Snapshot } from "../lib/viv";
import { DocsLink } from "./DocsLink";

// A "reaction" in Viv is something queued on a character's action queue from
// another action's `reactions:` block. The runtime stores these as
// `vivInternalState.actionQueues[characterID]: QueuedConstruct[]`. They drain
// when the character's next `selectAction` runs. Statuses (pending/succeeded/
// failed) live in `queuedConstructStatuses[uid]`.
//
// Plans live in their own tab — this view is purely about per-character
// action reactions.

type Status = "pending" | "succeeded" | "failed" | string;

function StatusBadge({ status }: { status: Status }) {
    const color =
        status === "succeeded" ? "var(--good)"
        : status === "failed" ? "var(--err)"
        : status === "pending" ? "var(--warn)"
        : "var(--muted)";
    return <span className="tag" style={{ color, borderColor: color }}>{status}</span>;
}

function ReactionCard({ c, status }: { c: any; status?: Status }) {
    const precast = c?.precastBindings ?? c?.bindings ?? {};
    const bindings = Object.entries(precast)
        .map(([role, ids]: [string, any]) => `@${role}=${Array.isArray(ids) ? ids.join(",") : ids}`)
        .join(" · ");
    return (
        <div className="row">
            <div>
                <span className="tag">{c?.type ?? "action"}</span>
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

export function ReactionsView({ snapshot }: { snapshot: Snapshot }) {
    const internal = snapshot.state.vivInternalState as any;
    if (!internal) {
        return <><h2>Reactions <DocsLink k="queues" /></h2><div className="empty">no runtime state in this snapshot</div></>;
    }

    const statuses: Record<string, Status> = internal.queuedConstructStatuses ?? {};
    const actionQueues: Record<string, any[]> = internal.actionQueues ?? {};

    const liveCount = Object.values(actionQueues).reduce((n, q) => n + (q?.length ?? 0), 0);

    // "Recently resolved" reactions: roster entries not in any live queue,
    // looked up in the status dict for their terminal fate. The roster is
    // maintained by the engine so we keep the action name and bindings even
    // after the runtime has forgotten the queued construct.
    const liveIDs = new Set<string>();
    for (const q of Object.values(actionQueues)) for (const c of q ?? []) if (c?.id) liveIDs.add(c.id);
    const roster = snapshot.reactionRoster ?? [];
    const resolved = roster
        .filter((r) => !liveIDs.has(r.id))
        .map((r) => ({ ...r, status: (statuses[r.id] ?? "resolved") as Status }));

    return (
        <>
            <h2>Reactions <DocsLink k="queues" /></h2>
            <div className="sub" style={{ color: "var(--muted)", marginBottom: "0.6rem" }}>
                Actions queued on a character's action queue by another action's <span className="mono">reactions:</span> block.
                {" "}Drained when the character's next <span className="mono">selectAction</span> runs.
                {" "}<b style={{ color: "var(--text)" }}>{liveCount}</b> pending ·
                {" "}<b style={{ color: "var(--text)" }}>{resolved.length}</b> resolved.
            </div>

            <h3>Per-character queues</h3>
            {Object.keys(actionQueues).length === 0 ? (
                <div className="empty">no characters have action queues yet</div>
            ) : Object.entries(actionQueues).map(([cid, q]) => {
                const cname = (snapshot.state.entities[cid] as any)?.name ?? cid;
                return (
                    <div key={cid} style={{ marginBottom: "0.6rem" }}>
                        <div className="mono" style={{ color: "var(--accent)", fontSize: "0.85rem" }}>
                            {cname} <span style={{ color: "var(--muted)" }}>·</span> {q?.length ?? 0} queued
                        </div>
                        {(q?.length ?? 0) === 0 ? (
                            <div className="empty" style={{ fontSize: "0.85rem" }}>empty</div>
                        ) : q.map((c: any) => (
                            <ReactionCard key={c?.id ?? Math.random()} c={c} status={statuses[c?.id]} />
                        ))}
                    </div>
                );
            })}

            <h3>Recently resolved ({resolved.length})</h3>
            {resolved.length === 0 ? (
                <div className="empty">no resolved reactions yet — step the simulation</div>
            ) : [...resolved].reverse().map((r) => {
                const bindings = Object.entries(r.precastBindings)
                    .map(([role, ids]: [string, any]) => `@${role}=${Array.isArray(ids) ? ids.join(",") : ids}`)
                    .join(" · ");
                return (
                    <div key={r.id} className="row">
                        <div>
                            <span className="tag">action</span>
                            <b>{r.name}</b>
                            <StatusBadge status={r.status} />
                            <span className="meta mono" style={{ marginLeft: "0.3rem", fontSize: "0.72rem" }}>
                                queued on {r.initiatorName} @ f{r.firstSeenFrame}
                            </span>
                        </div>
                        {bindings ? (
                            <div className="sub mono" style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                                {bindings}
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </>
    );
}
