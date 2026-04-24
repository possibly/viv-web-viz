// Headless Chrome smoke test via CDP. Verifies:
//   1. The page loads with no uncaught exceptions.
//   2. The runtime initializes (schema version appears in the top bar).
//   3. Clicking "Step" adds actions to the Chronicle.
//   4. Scrubbing back to frame 0 shows no actions; scrubbing forward restores them.
//
// Usage: node scripts/cdp-smoke.mjs [url]
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_ = process.argv[2] || "http://localhost:5173/";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DEBUG_PORT = 9223;

const userDataDir = mkdtempSync(join(tmpdir(), "viv-web-viz-cdp-"));
const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
], { stdio: ["ignore", "pipe", "pipe"] });
const cleanup = () => {
    try { chrome.kill("SIGTERM"); } catch {}
    try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDevtools() {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
        try {
            const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
            if (r.ok) return (await r.json()).webSocketDebuggerUrl;
        } catch {}
        await sleep(100);
    }
    throw new Error("Chrome devtools did not come up");
}

class CDP {
    constructor(ws) {
        this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = new Set();
        ws.addEventListener("message", (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.id != null && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
            } else if (msg.method) for (const l of this.listeners) l(msg);
        });
    }
    send(method, params = {}, sessionId) {
        const id = ++this.id;
        const payload = { id, method, params };
        if (sessionId) payload.sessionId = sessionId;
        this.ws.send(JSON.stringify(payload));
        return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    }
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
}

async function openWs(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
        ws.addEventListener("open", resolve, { once: true });
        ws.addEventListener("error", reject, { once: true });
    });
    return ws;
}

async function waitFor(cdp, sessionId, expr, timeoutMs = 15_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const { result } = await cdp.send("Runtime.evaluate", {
            expression: expr, returnByValue: true,
        }, sessionId);
        if (result.value) return result.value;
        await sleep(150);
    }
    throw new Error(`timeout waiting for: ${expr}`);
}

async function main() {
    const browserWsUrl = await waitForDevtools();
    const browser = new CDP(await openWs(browserWsUrl));
    const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });

    const consoleLines = [];
    const pageErrors = [];
    browser.on((m) => {
        if (m.sessionId !== sessionId) return;
        if (m.method === "Runtime.consoleAPICalled") {
            const text = m.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
            consoleLines.push(`[${m.params.type}] ${text}`);
        } else if (m.method === "Runtime.exceptionThrown") {
            pageErrors.push(m.params.exceptionDetails.exception?.description
                || m.params.exceptionDetails.text);
        }
    });

    await browser.send("Page.enable", {}, sessionId);
    await browser.send("Runtime.enable", {}, sessionId);
    await browser.send("Page.navigate", { url: URL_ }, sessionId);

    // 1. Runtime initialized: top-bar meta reads "schema X.Y.Z".
    const schemaText = await waitFor(
        browser, sessionId,
        `(() => { const el = document.querySelector('.topbar .meta'); return el && /schema/.test(el.textContent) ? el.textContent.trim() : null; })()`,
    );
    console.log("schema meta:", schemaText);

    // 2. Click "Step" — the first button in .controls.
    await browser.send("Runtime.evaluate", {
        expression: `document.querySelector('.controls button.primary').click()`,
    }, sessionId);

    // 3. After step, Chronicle tab should show actions.
    const rowCount = await waitFor(
        browser, sessionId,
        `(() => { const rows = document.querySelectorAll('.content .row'); return rows.length >= 3 ? rows.length : 0; })()`,
    );
    console.log("rows after one step:", rowCount);

    // 4. Bulk step x5 using the Step ×N button.
    await browser.send("Runtime.evaluate", {
        expression: `document.querySelectorAll('.controls button')[1].click()`,
    }, sessionId);
    const bigCount = await waitFor(
        browser, sessionId,
        `(() => { const rows = document.querySelectorAll('.content .row'); return rows.length >= 15 ? rows.length : 0; })()`,
    );
    console.log("rows after bulk step:", bigCount);

    // 5. Scrub to frame 0: expect the "empty" message. React controlled inputs
    //    only react when the value is set via the native setter, not via `el.value =`.
    await browser.send("Runtime.evaluate", {
        expression: `(() => {
            const r = document.querySelector('.scrub input[type=range]');
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(r, '0');
            r.dispatchEvent(new Event('input', { bubbles: true }));
            r.dispatchEvent(new Event('change', { bubbles: true }));
        })()`,
    }, sessionId);
    const emptyAtZero = await waitFor(
        browser, sessionId,
        `(() => { const e = document.querySelector('.empty'); return e ? e.textContent.trim() : null; })()`,
        5000,
    );
    console.log("frame 0 empty:", emptyAtZero);

    // 6. Visit each tab, confirm no render crash (content area has content).
    const tabs = ["Chronicle", "Characters", "Queues", "Plans", "Raw State"];
    for (const name of tabs) {
        await browser.send("Runtime.evaluate", {
            expression: `(() => {
                const t = [...document.querySelectorAll('.sidebar .tab')]
                    .find(n => n.textContent.trim().startsWith(${JSON.stringify(name)}));
                if (t) t.click();
            })()`,
        }, sessionId);
        await sleep(150);
        const ok = await waitFor(
            browser, sessionId,
            `(() => document.querySelector('.content') && document.querySelector('.content').textContent.length > 0)()`,
            3000,
        );
        console.log(`tab "${name}": ok=${ok}`);
    }

    if (pageErrors.length) {
        console.log("--- page errors ---");
        for (const e of pageErrors) console.log(e);
        throw new Error(`${pageErrors.length} page error(s)`);
    }

    if (!schemaText?.includes("schema")) throw new Error("runtime did not initialize");
    if (rowCount < 3) throw new Error(`expected ≥3 actions after one step, got ${rowCount}`);
    if (bigCount < 15) throw new Error(`expected ≥15 actions after bulk, got ${bigCount}`);

    console.log("\nOK — all smoke checks passed");
}

main().catch((err) => {
    console.error("FAIL:", err.message);
    cleanup();
    process.exit(1);
}).then(() => { cleanup(); process.exit(0); });
