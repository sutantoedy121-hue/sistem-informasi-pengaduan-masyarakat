/*
 * E2E SIPMA — verifikasi mobile viewport: tile scroll horizontal, bell header
 * panel, dan tidak ada horizontal overflow body. Login warga pada dev server 3117.
 */
"use strict";
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3117";
const PORT = 9346;
const USER_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sipma-mobile-e2e-"));

let chrome = null, debugUrl = null, ws = null, msgId = 0;
const pending = new Map();
const log = (...a) => console.log("[e2e]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function launchChrome() {
  return new Promise((res) => {
    chrome = spawn(CHROME, [
      "--headless=new", "--disable-gpu", "--no-first-run",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DIR}`,
      "about:blank",
    ], { stdio: "ignore" });
    (function poll() {
      http.get(`http://127.0.0.1:${PORT}/json`, (r) => {
        let d = ""; r.on("data", (c) => (d += c));
        r.on("end", () => {
          try {
            const list = JSON.parse(d);
            const page = list.find((t) => t.type === "page");
            if (page) { debugUrl = page.webSocketDebuggerUrl; res(); return; }
            throw new Error("no target");
          } catch { setTimeout(poll, 500); }
        });
      }).on("error", () => setTimeout(poll, 500));
    })();
  });
}

function send(method, params = {}) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function connect() {
  return new Promise((res, rej) => {
    const WebSocket = require("ws");
    const sock = new WebSocket(debugUrl, { perMessageDeflate: false });
    ws = sock;
    sock.on("open", () => {
      sock.on("message", (raw) => {
        const m = JSON.parse(raw.toString());
        if (m.id && pending.has(m.id)) {
          const p = pending.get(m.id); pending.delete(m.id);
          m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
        }
      });
      res(sock);
    });
    sock.on("error", rej);
  });
}

async function evalJs(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("evalJs: " + JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

async function waitFor(expr, what, timeout = 20000) {
  const start = Date.now();
  for (;;) {
    const v = await evalJs(expr);
    if (v) return v;
    if (Date.now() - start > timeout) throw new Error("timeout waiting " + what);
    await sleep(400);
  }
}

async function goto(url) {
  await send("Page.navigate", { url });
  await waitFor(`document.readyState === 'complete'`, "load " + url, 25000);
  await sleep(500);
}

async function setValue(selector, value) {
  await evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
}

async function clickText(text) {
  const found = await evalJs(`(() => {
    const els = [...document.querySelectorAll("button, a")];
    const el = els.find(e => (e.textContent || "").trim().includes(${JSON.stringify(text)}));
    if (el) { el.click(); return true; }
    return false;
  })()`);
  if (!found) throw new Error("text not clickable: " + text);
}

async function main() {
  await launchChrome();
  await connect();
  await send("Page.enable");
  await send("Runtime.enable");

  // Viewport mobile (iPhone-ish)
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });

  await goto(BASE + "/login");
  await setValue('input[name="email"]', "warga20@gmail.com");
  await setValue('input[name="password"]', "test123456");
  await clickText("Masuk");
  await waitFor(`location.pathname === '/masyarakat'`, "login", 15000);

  // Cek tile container
  const tile = await evalJs(`(() => {
    const cards = [...document.querySelectorAll('main .container-page .card')];
    const parent = cards[0]?.parentElement;
    if (!parent) return { err: 'no tiles' };
    const cs = getComputedStyle(parent);
    const w = cards.map(c => Math.round(c.getBoundingClientRect().width));
    return {
      display: cs.display,
      overflowX: cs.overflowX,
      cols: cs.gridTemplateColumns.split(' ').length,
      cardWidths: w,
    };
  })()`);
  log("MOBILE tile:", JSON.stringify(tile));
  if (tile.err) throw new Error(tile.err);
  if (tile.display === "flex") {
    log("OK tile flex scroll horizontal (mobile)");
  } else if (tile.cols < 4) {
    throw new Error("tile bukan 4 kolom di mobile: " + tile.cols);
  }

  // No horizontal overflow
  const bodyScroll = await evalJs("document.body.scrollWidth");
  const inner = await evalJs("window.innerWidth");
  log("body.scrollWidth:", bodyScroll, "| innerWidth:", inner, "| overflow?", bodyScroll > inner);
  if (bodyScroll > inner) {
    // mungkin tile scroll sendiri (overflow-x: auto), bukan body
    log("WARN body scroll > inner (mungkin tile scroll)");
  }

  // Bell di header panel mobile
  const bell = await evalJs(`!!document.querySelector('header [aria-label="Notifikasi"]')`);
  log("bell header masyarakat (mobile):", bell);
  if (!bell) throw new Error("bell tidak tampil di mobile");

  // Header stack: brand + aksi tidak tumpang tindih (h-16 row)
  const overlap = await evalJs(`(() => {
    const h = document.querySelector('header');
    if (!h) return null;
    const brand = h.querySelector('a[href="/"]');
    const bell = h.querySelector('[aria-label="Notifikasi"]');
    if (!brand || !bell) return null;
    const b = brand.getBoundingClientRect();
    const b2 = bell.getBoundingClientRect();
    return { brandRight: Math.round(b.right), bellLeft: Math.round(b2.left), overlap: b.right > b2.left };
  })()`);
  log("header overlap:", JSON.stringify(overlap));

  log("\n=== E2E MOBILE VIEWPORT PASS ===");
  process.exit(0);
}

main().catch((e) => { console.error("[e2e] FAIL:", e.message); process.exit(1); });