// Small anchor linking each view to its relevant section of the viv docs.
// URLs follow the monorepo layout at viv/docs/reference/language/NN-name.md(x),
// which the site renders at viv.sifty.studio/reference/language/NN-name/.

const BASE = "https://viv.sifty.studio/reference/language";

export const DOCS = {
    chronicle: { slug: "10-actions",        label: "Actions" },
    characters: { slug: "20-runtime-model", label: "Runtime model · Knowledge Manager", hash: "knowledge-manager" },
    queues:     { slug: "11-reactions",     label: "Reactions" },
    plans:      { slug: "17-plans",         label: "Plans" },
    raw:        { slug: "20-runtime-model", label: "Runtime model" },
} as const;

export type DocsKey = keyof typeof DOCS;

export function DocsLink({ k }: { k: DocsKey }) {
    const d = DOCS[k];
    const hash = "hash" in d && d.hash ? `#${d.hash}` : "";
    const href = `${BASE}/${d.slug}/${hash}`;
    return (
        <a className="docs-link" href={href} target="_blank" rel="noopener noreferrer" title={d.label}>
            docs ↗
        </a>
    );
}
