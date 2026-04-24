import { useState } from "react";
import type { Snapshot } from "../lib/viv";
import { DocsLink } from "./DocsLink";

export function CharactersView({ snapshot }: { snapshot: Snapshot }) {
    const s = snapshot.state;
    const [selected, setSelected] = useState<string | null>(s.characters[0] ?? null);
    const isNarrow = typeof window !== "undefined"
        && window.matchMedia("(max-width: 720px)").matches;
    const [mobileView, setMobileView] = useState<"list" | "detail">(isNarrow ? "list" : "detail");
    const char = selected ? (s.entities[selected] as any) : null;
    const memories = (char?.memories ?? {}) as Record<string, any>;

    // We compute "initial salience" as the max salience observed — a reasonable proxy
    // since salience only decays. That lets us render a decay bar without needing the
    // original value stored on the memory.
    const rawRows = Object.entries(memories).map(([actionID, mem]: [string, any]) => {
        const action = s.entities[actionID] as any;
        return {
            actionID,
            memory: mem,
            summary: action?.report ?? action?.gloss ?? "(unknown action)",
            timestamp: action?.timestamp ?? 0,
        };
    });
    const maxSalience = rawRows.reduce(
        (m, r) => Math.max(m, Number(r.memory?.salience ?? 0)),
        0,
    ) || 1;
    const memoryRows = rawRows.sort((a, b) => b.timestamp - a.timestamp);

    const showList = !isNarrow || mobileView === "list";
    const showDetail = !isNarrow || mobileView === "detail";

    return (
        <div className={"grid-chars" + (isNarrow ? " mobile" : "")}>
            {showList ? (
                <div className="list">
                    <h2>Characters <DocsLink k="characters" /></h2>
                    {s.characters.map((id) => {
                        const c = s.entities[id] as any;
                        const mem = (c?.memories ?? {}) as Record<string, any>;
                        const memCount = Object.keys(mem).length;
                        const forgotten = Object.values(mem).filter((m: any) => m?.forgotten).length;
                        return (
                            <div
                                key={id}
                                className={"char-item" + (selected === id ? " active" : "")}
                                onClick={() => { setSelected(id); if (isNarrow) setMobileView("detail"); }}
                            >
                                <div><b>{c?.name ?? id}</b></div>
                                <div className="sub mono">
                                    {memCount} mem ({forgotten} forgotten) · mood {c?.mood ?? 0}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}
            {showDetail ? (
                <div className="detail">
                    {!char ? (
                        <div className="empty">select a character</div>
                    ) : (
                        <>
                            {isNarrow ? (
                                <button
                                    className="back-btn"
                                    onClick={() => setMobileView("list")}
                                >← Characters</button>
                            ) : null}
                            <h2>{char.name ?? char.id}</h2>
                        <h3>Memories ({memoryRows.length})</h3>
                        {memoryRows.length === 0 ? (
                            <div className="empty">no memories</div>
                        ) : memoryRows.map((r) => {
                            const sal = Number(r.memory?.salience ?? 0);
                            const pct = Math.max(0, Math.min(100, (sal / maxSalience) * 100));
                            const formed = r.memory?.formationTimestamp;
                            const storyAge = typeof formed === "number"
                                ? snapshot.timestamp - formed
                                : null;
                            return (
                                <div key={r.actionID} className="memory-card">
                                    <div className="memory-summary">{r.summary}</div>
                                    <div className="memory-meta mono">
                                        <span>T={r.timestamp}</span>
                                        {typeof formed === "number" ? <span>formed T={formed}</span> : null}
                                        {storyAge != null ? <span>age Δ={storyAge}</span> : null}
                                        {r.memory?.forgotten
                                            ? <span style={{ color: "var(--warn)" }}>forgotten</span>
                                            : null}
                                    </div>
                                    <div className="salience-row">
                                        <div
                                            className="salience-bar"
                                            title={`salience ${sal.toFixed(4)} / peak ${maxSalience.toFixed(4)}`}
                                        >
                                            <div
                                                className="salience-fill"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: r.memory?.forgotten
                                                        ? "var(--warn)"
                                                        : pct > 60 ? "var(--good)"
                                                        : pct > 25 ? "var(--accent)"
                                                        : "var(--err)",
                                                }}
                                            />
                                        </div>
                                        <span className="salience-num mono">
                                            {sal.toFixed(3)} <span style={{ color: "var(--muted)" }}>({pct.toFixed(0)}%)</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                            <h3>Raw</h3>
                            <pre className="json">{JSON.stringify(char, null, 2)}</pre>
                        </>
                    )}
                </div>
            ) : null}
        </div>
    );
}
