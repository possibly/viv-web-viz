// CDP test for the Sifting tab. Steps 30 frames so the runtime has produced
// some `celebrate` / `argue` / `hello` actions, then opens the Sifting tab,
// runs `happy-memory` over Alice and `good-day` over Alice, and confirms the
// matches render.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_ = process.argv[2] || "http://localhost:5173/";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9226;
const udd = mkdtempSync(join(tmpdir(), "viv-sift-cdp-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--no-first-run",`--remote-debugging-port=${PORT}`,`--user-data-dir=${udd}`,"about:blank"]);
const cleanup = () => { try{chrome.kill();}catch{} try{rmSync(udd,{recursive:true,force:true});}catch{} };
process.on("exit", cleanup); process.on("SIGINT", ()=>{cleanup();process.exit(130);});
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitDT(){const d=Date.now()+10000;while(Date.now()<d){try{const r=await fetch(`http://127.0.0.1:${PORT}/json/version`);if(r.ok)return (await r.json()).webSocketDebuggerUrl;}catch{}await sleep(100);}throw new Error("dt");}
class CDP { constructor(ws){this.ws=ws;this.id=0;this.p=new Map();this.ls=new Set();ws.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id!=null&&this.p.has(m.id)){const{resolve,reject}=this.p.get(m.id);this.p.delete(m.id);m.error?reject(new Error(m.error.message)):resolve(m.result);}else if(m.method)for(const l of this.ls)l(m);});} send(method,params={},sid){const id=++this.id;const pl={id,method,params};if(sid)pl.sessionId=sid;this.ws.send(JSON.stringify(pl));return new Promise((res,rej)=>this.p.set(id,{resolve:res,reject:rej}));} on(fn){this.ls.add(fn);return()=>this.ls.delete(fn);} }
async function openWs(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.addEventListener("open",r,{once:true});ws.addEventListener("error",j,{once:true});});return ws;}
async function waitFor(cdp,sid,expr,ms=20000){const d=Date.now()+ms;while(Date.now()<d){const{result}=await cdp.send("Runtime.evaluate",{expression:expr,returnByValue:true},sid);if(result.value) return result.value;await sleep(150);}throw new Error(`timeout: ${expr}`);}

async function main() {
    const browserWsUrl = await waitDT();
    const browser = new CDP(await openWs(browserWsUrl));
    const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });

    const pageErrors = [];
    browser.on((m) => {
        if (m.sessionId !== sessionId) return;
        if (m.method === "Runtime.exceptionThrown") {
            pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
        }
    });

    await browser.send("Page.enable", {}, sessionId);
    await browser.send("Runtime.enable", {}, sessionId);
    await browser.send("Page.navigate", { url: URL_ }, sessionId);

    await waitFor(browser, sessionId,
        `(()=>{const el=document.querySelector('.topbar .meta'); return el && /schema/.test(el.textContent);})()`);
    console.log("runtime initialized");

    // Step 30 frames via the bulk control.
    await browser.send("Runtime.evaluate", { expression: `(()=>{
        const input=document.querySelector('.controls input[type=number]');
        const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
        setter.call(input,'30'); input.dispatchEvent(new Event('input',{bubbles:true}));
        document.querySelectorAll('.controls button')[1].click();
    })()` }, sessionId);
    const rows = await waitFor(browser, sessionId,
        `(()=>{const r=document.querySelectorAll('.content .row');return r.length>=60?r.length:0;})()`);
    console.log("chronicle rows after bulk:", rows);

    // Open Sifting tab.
    await browser.send("Runtime.evaluate", { expression:
        `[...document.querySelectorAll('.sidebar .tab')].find(n=>n.textContent.trim().startsWith('Sifting')).click()`,
    }, sessionId);
    await waitFor(browser, sessionId,
        `document.querySelector('.sift-row') ? true : false`);

    const patternNames = await browser.send("Runtime.evaluate", {
        expression: `[...document.querySelectorAll('.sift-row .sift-name')].map(n=>n.textContent.trim())`,
        returnByValue: true,
    }, sessionId);
    console.log("sifting entries visible:", patternNames.result.value);

    // For the happy-memory query, pick Alice then Run.
    await browser.send("Runtime.evaluate", { expression: `(()=>{
        const rows = [...document.querySelectorAll('.sift-row')];
        const row = rows.find(r => r.querySelector('.sift-name')?.textContent.trim() === 'happy-memory');
        const select = row.querySelector('select');
        const setter=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;
        setter.call(select, 'alice'); select.dispatchEvent(new Event('change',{bubbles:true}));
        row.querySelector('button').click();
    })()` }, sessionId);
    await sleep(400);
    const result1 = await browser.send("Runtime.evaluate", {
        expression: `document.querySelector('.content .row .tag')?.textContent`,
        returnByValue: true,
    }, sessionId);
    console.log("result tag after happy-memory run:", result1.result.value);

    // Now run the good-day pattern over Alice.
    await browser.send("Runtime.evaluate", { expression: `(()=>{
        const rows = [...document.querySelectorAll('.sift-row')];
        const row = rows.find(r => r.querySelector('.sift-name')?.textContent.trim() === 'good-day');
        const select = row.querySelector('select');
        const setter=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;
        setter.call(select, 'alice'); select.dispatchEvent(new Event('change',{bubbles:true}));
        row.querySelector('button').click();
    })()` }, sessionId);
    await sleep(600);

    const results = await browser.send("Runtime.evaluate", {
        expression: `(()=>{
            const rows = [...document.querySelectorAll('.content > .row')];
            return rows.map(r => ({
                text: r.textContent.replace(/\\s+/g,' ').trim().slice(0,200),
                hasDiagram: !!r.querySelector('details'),
            }));
        })()`,
        returnByValue: true,
    }, sessionId);
    console.log("result rows:");
    for (const r of results.result.value) console.log("  ·", r);

    if (pageErrors.length) {
        console.log("\npage errors:");
        for (const e of pageErrors) console.log(" ", e);
        throw new Error(`${pageErrors.length} page errors`);
    }
    console.log("\nOK");
}

main().catch(e => { console.error("FAIL:", e.message); cleanup(); process.exit(1); })
      .then(() => { cleanup(); process.exit(0); });
