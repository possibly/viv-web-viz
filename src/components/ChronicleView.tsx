import type { Snapshot } from "../lib/viv";
import { DocsLink } from "./DocsLink";

export function ChronicleView({ snapshot }: { snapshot: Snapshot }) {
    const s = snapshot.state;
    const newIDs = new Set(snapshot.newActionIDs);
    if (s.actions.length === 0) {
        return <div className="empty">no actions yet — step the simulation</div>;
    }
    return (
        <>
            <h2>Chronicle · {s.actions.length} action{s.actions.length === 1 ? "" : "s"} <DocsLink k="chronicle" /></h2>
            {s.actions.map((id) => {
                const a = s.entities[id] as any;
                const summary = a?.report ?? a?.gloss ?? "(no summary)";
                const t = a?.timestamp;
                const isNew = newIDs.has(id);
                return (
                    <div key={id} className="row">
                        <span className="t mono">[T={t}]</span>
                        {isNew ? <span className="tag" style={{ color: "var(--good)" }}>new</span> : null}
                        <span>{summary}</span>
                    </div>
                );
            })}
        </>
    );
}
