import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEngine, type Engine } from "./lib/engine";
import type { Snapshot } from "./lib/viv";
import { Controls } from "./components/Controls";
import { Sidebar, type TabKey } from "./components/Sidebar";
import { ChronicleView } from "./components/ChronicleView";
import { CharactersView } from "./components/CharactersView";
import { QueuesView } from "./components/QueuesView";
import { PlansView } from "./components/PlansView";
import { RawView } from "./components/RawView";
import { SourceView } from "./components/SourceView";
import { SiftingView } from "./components/SiftingView";

// Use Vite's BASE_URL so the fetch works under both `/` (dev, root deploy) and
// `/viv-web-viz/` (GitHub Pages subpath deploy).
const DEFAULT_BUNDLE_URL = `${import.meta.env.BASE_URL}bundles/hello-viv.json`;
const DEFAULT_SOURCE_URL = `${import.meta.env.BASE_URL}bundles/hello-viv.viv`;

export function App() {
    const [engine, setEngine] = useState<Engine | null>(null);
    const [frame, setFrame] = useState(0);
    const [historyLen, setHistoryLen] = useState(1);
    const [tab, setTab] = useState<TabKey>("chronicle");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [headerOpen, setHeaderOpen] = useState(() => window.matchMedia("(min-width: 720px)").matches);
    const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia("(min-width: 720px)").matches);
    const initialized = useRef(false);

    const loadDefaultBundle = useCallback(async () => {
        setError(null);
        setBusy(true);
        try {
            const r = await fetch(DEFAULT_BUNDLE_URL);
            if (!r.ok) throw new Error(`failed to fetch default bundle: ${r.status}`);
            const bundle = await r.json();
            // Companion `.viv` source is optional — if present, we show it read-only
            // on the Source tab. A 404 is fine.
            let sourceCode: string | null = null;
            try {
                const s = await fetch(DEFAULT_SOURCE_URL);
                if (s.ok) sourceCode = await s.text();
            } catch { /* ignore */ }
            const eng = await createEngine({ contentBundle: bundle, sourceCode });
            setEngine(eng);
            setHistoryLen(eng.snapshots.length);
            setFrame(0);
        } catch (e: any) {
            setError(e?.stack || String(e));
        } finally {
            setBusy(false);
        }
    }, []);

    const loadBundleAndInit = useCallback(async (bundle: unknown) => {
        setError(null);
        setBusy(true);
        try {
            const eng = await createEngine({ contentBundle: bundle });
            setEngine(eng);
            setHistoryLen(eng.snapshots.length);
            setFrame(0);
        } catch (e: any) {
            setError(e?.stack || String(e));
        } finally {
            setBusy(false);
        }
    }, []);

    // Auto-load default bundle once.
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        loadDefaultBundle();
    }, [loadDefaultBundle]);

    const step = useCallback(async (n: number) => {
        if (!engine || busy) return;
        setBusy(true);
        setError(null);
        try {
            await engine.stepMany(n);
            setHistoryLen(engine.snapshots.length);
            setFrame(engine.snapshots.length - 1);
        } catch (e: any) {
            setError(e?.stack || String(e));
        } finally {
            setBusy(false);
        }
    }, [engine, busy]);

    const onUploadBundle = useCallback(async (file: File) => {
        try {
            const text = await file.text();
            const bundle = JSON.parse(text);
            await loadBundleAndInit(bundle);
        } catch (e: any) {
            setError(e?.stack || String(e));
        }
    }, [loadBundleAndInit]);

    const snapshot: Snapshot | null = engine?.snapshots[frame] ?? null;

    // Keyboard nav: arrow keys scrub.
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
            if (e.key === "ArrowLeft") { setFrame((f) => Math.max(0, f - 1)); e.preventDefault(); }
            if (e.key === "ArrowRight") { setFrame((f) => Math.min(historyLen - 1, f + 1)); e.preventDefault(); }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [historyLen]);

    const counts = useMemo(() => {
        if (!snapshot) return { chronicle: 0, characters: 0, queues: 0, plans: 0, sifting: 0 };
        const s = snapshot.state;
        const internal = s.vivInternalState as any;
        const actionQueues: Record<string, any[]> = internal?.actionQueues ?? {};
        const planQueue: any[] = internal?.planQueue ?? [];
        const activePlans: Record<string, any> = internal?.activePlans ?? {};
        const statuses: Record<string, string> = internal?.queuedConstructStatuses ?? {};
        const queueSize =
            Object.values(actionQueues).reduce((n, q) => n + (q?.length ?? 0), 0) +
            planQueue.filter((p) => (statuses[p?.id] ?? "pending") === "pending").length;
        const planSize = Object.keys(activePlans).length +
            planQueue.filter((p) => (statuses[p?.id] ?? "pending") === "pending").length;
        return {
            chronicle: s.actions.length,
            characters: s.characters.length,
            queues: queueSize,
            plans: planSize,
            sifting: (engine?.patterns.length ?? 0) + (engine?.queries.length ?? 0),
        };
    }, [snapshot, engine]);

    const currentTabLabel =
        tab === "chronicle" ? "Chronicle"
        : tab === "characters" ? "Characters"
        : tab === "queues" ? "Queues"
        : tab === "plans" ? "Plans"
        : tab === "sifting" ? "Sifting"
        : tab === "source" ? "Source" : "Raw State";

    return (
        <div className="app">
            <div className="minibar">
                <button
                    className="icon-btn"
                    onClick={() => setSidebarOpen((v) => !v)}
                    aria-label="Toggle sidebar"
                >☰</button>
                <button
                    className="icon-btn"
                    onClick={() => setHeaderOpen((v) => !v)}
                    aria-label="Toggle header"
                    title={headerOpen ? "Hide controls" : "Show controls"}
                >{headerOpen ? "▲" : "▼"}</button>
                <span className="meta mono" style={{ marginLeft: "0.5rem" }}>
                    {currentTabLabel} · f{frame}/{historyLen - 1} · T={snapshot?.timestamp ?? 0}
                </span>
                <span className="spacer" />
                {!headerOpen ? (
                    <button className="primary" onClick={() => step(1)} disabled={busy || !engine}>Step</button>
                ) : null}
            </div>

            {headerOpen ? (
                <>
                    <div className="topbar">
                        <h1>Viv Runtime Explorer</h1>
                        <span className="meta">
                            {engine ? <>schema {engine.schemaVersion}</> : busy ? "loading…" : "not loaded"}
                        </span>
                        <span className="spacer" />
                        <button onClick={() => loadDefaultBundle()} disabled={busy}>
                            Reload hello-viv demo
                        </button>
                        <label className="meta" style={{ cursor: "pointer" }}>
                            Load bundle…
                            <input
                                type="file"
                                accept="application/json,.json"
                                style={{ display: "none" }}
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadBundle(f); }}
                            />
                        </label>
                        <span className="meta"><span className="kbd">←</span> <span className="kbd">→</span> scrub</span>
                    </div>

                    <Controls
                        frame={frame}
                        historyLen={historyLen}
                        setFrame={setFrame}
                        onStep={(n) => step(n)}
                        busy={busy || !engine}
                        timestamp={snapshot?.timestamp ?? 0}
                    />
                </>
            ) : null}

            {error ? (
                <div className="content err">{error}</div>
            ) : (
                <div className={"main" + (sidebarOpen ? "" : " sidebar-collapsed")}>
                    {sidebarOpen ? (
                        <>
                            <div
                                className="sidebar-backdrop"
                                onClick={() => setSidebarOpen(false)}
                                aria-hidden="true"
                            />
                            <Sidebar
                                tab={tab}
                                setTab={(t) => {
                                    setTab(t);
                                    if (window.matchMedia("(max-width: 720px)").matches) setSidebarOpen(false);
                                }}
                                counts={counts}
                                hasSource={!!engine?.sourceCode}
                                hasSifting={!!engine && (engine.patterns.length + engine.queries.length > 0)}
                            />
                        </>
                    ) : null}
                    <div className="content">
                        {!snapshot ? (
                            <div className="empty">no snapshot yet</div>
                        ) : tab === "chronicle" ? (
                            <ChronicleView snapshot={snapshot} />
                        ) : tab === "characters" ? (
                            <CharactersView snapshot={snapshot} />
                        ) : tab === "queues" ? (
                            <QueuesView snapshot={snapshot} />
                        ) : tab === "plans" ? (
                            <PlansView snapshot={snapshot} />
                        ) : tab === "sifting" ? (
                            engine ? <SiftingView engine={engine} snapshot={snapshot} /> : null
                        ) : tab === "source" ? (
                            <SourceView source={engine?.sourceCode ?? null} />
                        ) : (
                            <RawView snapshot={snapshot} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
