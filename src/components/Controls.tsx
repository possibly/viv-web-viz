import { useState } from "react";

type Props = {
    frame: number;
    historyLen: number;
    timestamp: number;
    setFrame: (n: number) => void;
    onStep: (n: number) => void;
    busy: boolean;
};

export function Controls({ frame, historyLen, timestamp, setFrame, onStep, busy }: Props) {
    const [bulk, setBulk] = useState(10);
    const atLiveHead = frame === historyLen - 1;
    return (
        <div className="controls">
            <button onClick={() => onStep(1)} disabled={busy} className="primary">Step</button>
            <button onClick={() => onStep(bulk)} disabled={busy || bulk < 1}>Step ×{bulk}</button>
            <input
                type="number" min={1} max={1000} value={bulk}
                onChange={(e) => setBulk(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
            />
            <div className="scrub">
                <button onClick={() => setFrame(0)} disabled={frame === 0}>⏮</button>
                <button onClick={() => setFrame(Math.max(0, frame - 1))} disabled={frame === 0}>◀</button>
                <input
                    type="range"
                    min={0}
                    max={Math.max(0, historyLen - 1)}
                    value={frame}
                    onChange={(e) => setFrame(Number(e.target.value))}
                />
                <button onClick={() => setFrame(Math.min(historyLen - 1, frame + 1))} disabled={atLiveHead}>▶</button>
                <button onClick={() => setFrame(historyLen - 1)} disabled={atLiveHead}>⏭</button>
            </div>
            <span className="meta mono">
                frame {frame} / {historyLen - 1} &nbsp;·&nbsp; T={timestamp}
            </span>
        </div>
    );
}
