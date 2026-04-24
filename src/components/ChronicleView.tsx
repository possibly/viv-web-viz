import { useState } from "react";
import type { Snapshot } from "../lib/viv";
import { DocsLink } from "./DocsLink";

// Is the given character bound into any role on the action? Actions store their
// role bindings under a `bindings` key (from empirical inspection of the
// activePlan shape; actions follow the same convention). Fall back to a
// stringified scan if the field is missing on some action variants.
function actionInvolves(action: any, characterID: string): boolean {
    const bindings = action?.bindings ?? action?.roleBindings;
    if (bindings && typeof bindings === "object") {
        for (const ids of Object.values(bindings as Record<string, any>)) {
            const arr = Array.isArray(ids) ? ids : [ids];
            if (arr.includes(characterID)) return true;
        }
        return false;
    }
    return JSON.stringify(action ?? {}).includes(`"${characterID}"`);
}

export function ChronicleView({ snapshot }: { snapshot: Snapshot }) {
    const s = snapshot.state;
    const newIDs = new Set(snapshot.newActionIDs);
    const [charFilter, setCharFilter] = useState<string>("");

    if (s.actions.length === 0) {
        return <div className="empty">no actions yet — step the simulation</div>;
    }

    const filtered = charFilter
        ? s.actions.filter((id) => actionInvolves(s.entities[id], charFilter))
        : s.actions;

    return (
        <>
            <h2>
                Chronicle · {charFilter ? `${filtered.length}/${s.actions.length}` : s.actions.length} action{filtered.length === 1 ? "" : "s"}
                <DocsLink k="chronicle" />
            </h2>
            <div className="chronicle-filter">
                <label className="meta">filter:</label>
                <select value={charFilter} onChange={(e) => setCharFilter(e.target.value)}>
                    <option value="">all characters</option>
                    {s.characters.map((cid) => {
                        const label = (s.entities[cid] as any)?.name ?? cid;
                        return <option key={cid} value={cid}>{label}</option>;
                    })}
                </select>
                {charFilter ? (
                    <span className="meta mono" style={{ fontSize: "0.78rem" }}>
                        showing actions involving <b>{(s.entities[charFilter] as any)?.name ?? charFilter}</b> in any role
                    </span>
                ) : null}
            </div>
            {filtered.length === 0 ? (
                <div className="empty">no actions match this filter</div>
            ) : null}
            {[...filtered].reverse().map((id) => {
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
