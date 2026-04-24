// A minimal Viv syntax highlighter. Tokenizes the source with a single combined
// regex (alternation is tried left-to-right, so order matters). Output is an
// array of {type, text} chunks consumable by a React renderer.
//
// Keywords are drawn from viv/docs/reference/language/*.md and compiler fixtures.
// The list isn't exhaustive — unknown identifiers just fall through as plain text.

export type Tok = { type: TokType; text: string };
export type TokType =
    | "comment" | "string" | "number"
    | "keyword" | "structural" | "role" | "entity"
    | "customfn" | "phase" | "punct" | "text";

// Keywords that introduce a construct ("structural") render differently from
// in-body keywords so the eye can find declarations quickly.
const STRUCTURAL = new Set([
    "action", "reserved", "plan", "reaction", "selector", "trope",
    "query", "pattern", "sifting", "include", "symbol", "enum",
]);
const KEYWORDS = new Set([
    "roles", "effects", "reactions", "conditions", "embargoes", "knowledge",
    "phases", "with", "gloss", "report", "urgency", "importance", "salience",
    "chance", "repeat", "if", "else", "elif", "when", "unless", "not",
    "and", "or", "in", "as", "for", "each", "true", "false", "null",
    "initiator", "recipient", "partner", "bystander", "character", "item",
    "location", "action", "precast",
    "queue", "advance", "succeed", "fail", "emit", "continue", "break",
]);

// Regex fragments (unicode-friendly for identifiers).
const RE = new RegExp([
    /(\/\/[^\n]*)/.source,               // 1: line comment
    /("(?:\\.|[^"\\])*")/.source,        // 2: string
    /(@[A-Za-z_][A-Za-z0-9_]*)/.source,  // 3: @role or @entity
    /(~[A-Za-z_][A-Za-z0-9_]*)/.source,  // 4: ~customFn
    /(>[A-Za-z_][A-Za-z0-9_]*)/.source,  // 5: >phaseName
    /(-?\b\d+(?:\.\d+)?\b)/.source,      // 6: number
    /([A-Za-z_][A-Za-z0-9_]*)/.source,   // 7: identifier/keyword
    /([:;,{}\[\]()+\-*/=<>!%&|^~?])/.source, // 8: punctuation
].join("|"), "g");

export function tokenize(src: string): Tok[] {
    const out: Tok[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RE.exec(src)) !== null) {
        if (m.index > lastIndex) out.push({ type: "text", text: src.slice(lastIndex, m.index) });
        if (m[1]) out.push({ type: "comment", text: m[1] });
        else if (m[2]) out.push({ type: "string", text: m[2] });
        else if (m[3]) out.push({ type: "role", text: m[3] });
        else if (m[4]) out.push({ type: "customfn", text: m[4] });
        else if (m[5]) out.push({ type: "phase", text: m[5] });
        else if (m[6]) out.push({ type: "number", text: m[6] });
        else if (m[7]) {
            const w = m[7];
            const t: TokType = STRUCTURAL.has(w) ? "structural"
                : KEYWORDS.has(w) ? "keyword"
                : "text";
            out.push({ type: t, text: w });
        } else if (m[8]) out.push({ type: "punct", text: m[8] });
        lastIndex = RE.lastIndex;
    }
    if (lastIndex < src.length) out.push({ type: "text", text: src.slice(lastIndex) });
    return out;
}
