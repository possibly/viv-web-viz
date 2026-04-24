import { tokenize } from "../lib/highlight-viv";
import { DocsLink } from "./DocsLink";

export function SourceView({ source }: { source: string | null }) {
    if (!source) {
        return (
            <>
                <h2>Source <DocsLink k="chronicle" /></h2>
                <div className="empty">
                    No `.viv` source provided alongside this bundle. Load a bundle with its
                    accompanying `.viv` file to see highlighted source here.
                </div>
            </>
        );
    }

    const tokens = tokenize(source);
    const lines = source.split("\n").length;

    return (
        <>
            <h2>Source <span className="meta mono" style={{ fontWeight: "normal", fontSize: "0.78rem" }}>{lines} lines · read-only</span> <DocsLink k="chronicle" /></h2>
            <pre className="viv-source"><code>
                {tokens.map((t, i) => (
                    <span key={i} className={`tok-${t.type}`}>{t.text}</span>
                ))}
            </code></pre>
        </>
    );
}
