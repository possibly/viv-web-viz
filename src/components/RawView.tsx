import { useState } from "react";
import type { Snapshot } from "../lib/viv";
import { DocsLink } from "./DocsLink";

type Section = "state" | "internal" | "entities";

export function RawView({ snapshot }: { snapshot: Snapshot }) {
    const [section, setSection] = useState<Section>("state");
    const s = snapshot.state;
    const data =
        section === "state" ? { ...s, entities: `<${Object.keys(s.entities).length} entities — switch to "entities"→>` }
            : section === "internal" ? s.vivInternalState
                : s.entities;
    return (
        <>
            <h2>Raw State <DocsLink k="raw" /></h2>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <button onClick={() => setSection("state")} className={section === "state" ? "primary" : ""}>Host state</button>
                <button onClick={() => setSection("internal")} className={section === "internal" ? "primary" : ""}>Viv internal</button>
                <button onClick={() => setSection("entities")} className={section === "entities" ? "primary" : ""}>Entities</button>
            </div>
            <pre className="json">{JSON.stringify(data, null, 2)}</pre>
        </>
    );
}
