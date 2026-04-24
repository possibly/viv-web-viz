import { useState } from "react";
import type { Snapshot, VivRuntime, SiftingMatch } from "../lib/viv";
import type { Engine } from "../lib/engine";
import { DocsLink } from "./DocsLink";

type Props = {
    engine: Engine;
    snapshot: Snapshot;
};

type QueryResult = { kind: "query"; name: string; searchDomain: string | null; ids: string[]; at: number };
type PatternResult = {
    kind: "pattern"; name: string; searchDomain: string | null;
    match: SiftingMatch | null; diagram?: string | null; at: number;
};
type RunResult = QueryResult | PatternResult;

function glossOf(snapshot: Snapshot, id: string): string {
    const a = (snapshot.state.entities as any)[id];
    if (!a) return id;
    return a.report ?? a.gloss ?? id;
}

export function SiftingView({ engine, snapshot }: Props) {
    const characters = snapshot.state.characters;
    const [queryChar, setQueryChar] = useState<Record<string, string>>({});
    const [patternChar, setPatternChar] = useState<Record<string, string>>({});
    const [history, setHistory] = useState<RunResult[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const add = (r: RunResult) => setHistory((h) => [r, ...h].slice(0, 12));

    const runQuery = async (name: string) => {
        setBusy(`q:${name}`); setErr(null);
        try {
            const dom = queryChar[name] || "";
            const args: Parameters<VivRuntime["runSearchQuery"]>[0] = { queryName: name };
            if (dom) args.searchDomain = dom;
            const ids = await engine.runtime.runSearchQuery(args);
            add({ kind: "query", name, searchDomain: dom || null, ids, at: Date.now() });
        } catch (e: any) { setErr(e?.message ?? String(e)); }
        finally { setBusy(null); }
    };

    const runPattern = async (name: string, requiresDomain: boolean) => {
        setBusy(`p:${name}`); setErr(null);
        try {
            const dom = patternChar[name] || "";
            if (requiresDomain && !dom) {
                setErr(`Pattern "${name}" needs a search-domain character.`);
                setBusy(null); return;
            }
            const args: Parameters<VivRuntime["runSiftingPattern"]>[0] = { patternName: name };
            if (dom) args.searchDomain = dom;
            const match = await engine.runtime.runSiftingPattern(args);
            let diagram: string | null = null;
            if (match) {
                try { diagram = await engine.runtime.constructSiftingMatchDiagram({ siftingMatch: match }); }
                catch { diagram = null; }
            }
            add({ kind: "pattern", name, searchDomain: dom || null, match, diagram, at: Date.now() });
        } catch (e: any) { setErr(e?.message ?? String(e)); }
        finally { setBusy(null); }
    };

    const anyDefined = engine.patterns.length + engine.queries.length > 0;

    return (
        <>
            <h2>Sifting <DocsLink k="sifting" /></h2>
            {!anyDefined ? (
                <div className="empty">This bundle defines no queries or sifting patterns.</div>
            ) : null}

            {err ? <div className="err" style={{ marginBottom: "0.5rem" }}>{err}</div> : null}

            {engine.queries.length > 0 ? (
                <>
                    <h3>Queries ({engine.queries.length})</h3>
                    <div className="sub" style={{ color: "var(--muted)", marginBottom: "0.35rem", fontSize: "0.78rem" }}>
                        Find actions matching association tags, importance, etc. Pick a character to
                        limit the search to their memories, or leave blank for the full chronicle.
                    </div>
                    {engine.queries.map((q) => (
                        <div key={q.name} className="sift-row">
                            <div className="sift-name mono"><b>{q.name}</b></div>
                            <select
                                value={queryChar[q.name] ?? ""}
                                onChange={(e) => setQueryChar({ ...queryChar, [q.name]: e.target.value })}
                            >
                                <option value="">(entire chronicle)</option>
                                {characters.map((c) => {
                                    const label = (snapshot.state.entities[c] as any)?.name ?? c;
                                    return <option key={c} value={c}>{label}</option>;
                                })}
                            </select>
                            <button onClick={() => runQuery(q.name)} disabled={busy !== null}>
                                {busy === `q:${q.name}` ? "…" : "Run"}
                            </button>
                        </div>
                    ))}
                </>
            ) : null}

            {engine.patterns.length > 0 ? (
                <>
                    <h3 style={{ marginTop: "1rem" }}>Sifting patterns ({engine.patterns.length})</h3>
                    <div className="sub" style={{ color: "var(--muted)", marginBottom: "0.35rem", fontSize: "0.78rem" }}>
                        Multi-action patterns that describe emergent storylines. A match is a binding
                        from each pattern action role to a concrete action.
                    </div>
                    {engine.patterns.map((p) => {
                        const charRole = Object.entries(p.roles).find(([, r]) => r?.as === "character");
                        const requiresDomain = !!charRole;
                        return (
                            <div key={p.name} className="sift-row">
                                <div className="sift-name mono"><b>{p.name}</b></div>
                                {requiresDomain ? (
                                    <select
                                        value={patternChar[p.name] ?? ""}
                                        onChange={(e) => setPatternChar({ ...patternChar, [p.name]: e.target.value })}
                                    >
                                        <option value="">(pick {charRole![0]})</option>
                                        {characters.map((c) => {
                                            const label = (snapshot.state.entities[c] as any)?.name ?? c;
                                            return <option key={c} value={c}>{label}</option>;
                                        })}
                                    </select>
                                ) : <span className="meta">(no domain)</span>}
                                <button onClick={() => runPattern(p.name, requiresDomain)} disabled={busy !== null}>
                                    {busy === `p:${p.name}` ? "…" : "Run"}
                                </button>
                            </div>
                        );
                    })}
                </>
            ) : null}

            <h3 style={{ marginTop: "1rem" }}>Results ({history.length})</h3>
            {history.length === 0 ? (
                <div className="empty">run a query or pattern above</div>
            ) : history.map((r) => (
                <div key={r.at} className="row">
                    <div>
                        <span className="tag">{r.kind}</span>
                        <b>{r.name}</b>
                        {r.searchDomain ? (
                            <span className="meta mono" style={{ marginLeft: "0.3rem" }}>
                                over {(snapshot.state.entities[r.searchDomain] as any)?.name ?? r.searchDomain}
                            </span>
                        ) : null}
                    </div>
                    {r.kind === "query" ? (
                        r.ids.length === 0 ? (
                            <div className="empty" style={{ fontSize: "0.85rem" }}>no matches</div>
                        ) : (
                            <div style={{ marginTop: "0.3rem" }}>
                                {r.ids.map((id) => (
                                    <div key={id} className="sub mono" style={{ fontSize: "0.82rem" }}>
                                        · {glossOf(snapshot, id)}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        r.match === null ? (
                            <div className="empty" style={{ fontSize: "0.85rem" }}>no match found</div>
                        ) : (
                            <>
                                <div style={{ marginTop: "0.3rem" }}>
                                    {Object.entries(r.match).map(([role, ids]) => (
                                        <div key={role} className="mono" style={{ fontSize: "0.82rem" }}>
                                            <span style={{ color: "var(--accent-2)" }}>@{role}</span>
                                            {" → "}
                                            {ids.map((id) => glossOf(snapshot, id)).join(", ")}
                                        </div>
                                    ))}
                                </div>
                                {r.diagram ? (
                                    <details style={{ marginTop: "0.35rem" }}>
                                        <summary className="sub" style={{ color: "var(--muted)", cursor: "pointer", fontSize: "0.78rem" }}>
                                            diagram
                                        </summary>
                                        <pre className="json">{r.diagram}</pre>
                                    </details>
                                ) : null}
                            </>
                        )
                    )}
                </div>
            ))}
        </>
    );
}
