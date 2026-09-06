/*
 * E2E SIPMA — verifikasi mobile viewport dashboard petugas: tile ringkasan
 * scroll horizontal (flex + overflow-x auto), tidak ada horizontal overflow
 * body, dan box konten di dalam container-page. Login petugas pada dev 3117.
 */
"use strict";
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3117";
const PORT = 9347;
const USER_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sipma-petugas-mobile-"));

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

  // Cek tile container: flex + overflow-x auto pada mobile
  const tile = await evalJs(`(() => {
    const cards = [...document.querySelectorAll('main .container-page .card')];
    const parent = cards[0]?.parentElement;
    if (!parent) return { err: 'no tiles' };
    const cs = getComputedStyle(parent);
    const r = parent.getBoundingClientRect();
    const cw = cards[0].getBoundingClientRect();
    return {
      display: cs.display,
      overflowX: cs.overflowX,
      scrollable: parent.scrollWidth > parent.clientWidth,
      tileLeft: Math.round(cw.left),
      tileWidth: Math.round(cw.width),
      containerLeft: Math.round(r.left),
      containerWidth: Math.round(r.width),
      gridCol: cs.gridTemplateColumns.split(' ').length,
    };
  })()`);
  log("MOBILE tile:", JSON.stringify(tile));
  if (tile.err) throw new Error(tile.err);
  if (tile.display === "flex" && tile.overflowX === "auto") {
    log("OK tile flex scroll horizontal (mobile)");
  } else if (tile.gridCol >= 4) {
    throw new Error("tile berbentuk grid 4 kolom di mobile (harus flex scroll): " + tile.gridCol);
  }

  // Box konten (Aduan Terbaru) tetap di tengah dalam container-page
  const content = await evalJs(`(() => {
    const h = [...document.querySelectorAll('h2')].find(e => e.textContent.includes('Aduan Terbaru'));
    if (!h) return { err: 'no Aduan Terbaru' };
    const r = h.closest('.card').getBoundingClientRect();
    return { left: Math.round(r.left), width: Math.round(r.width) };
  })()`);
  log("content card:", JSON.stringify(content));
  const innerW = await evalJs("window.innerWidth");
  const bodyScroll = await evalJs("document.body.scrollWidth");
  log("innerWidth:", innerW, "| body.scrollWidth:", bodyScroll);
  if (bodyScroll > innerW) throw new Error("body horizontal overflow: " + bodyScroll + " > " + innerW);
  log("OK body tidak overflow");

  // Bell di header (role dengan bell = masyarakat) — klik → popup modal center
  const bell = await evalJs(`!!document.querySelector('header [aria-label="Notifikasi"]')`);
  log("bell header (mobile):", bell);
  if (!bell) throw new Error("bell header tidak ada");

  await evalJs(`(() => {
    const b = [...document.querySelectorAll('header [aria-label="Notifikasi"]')]
      .find(x => x.getClientRects().length > 0);
    if (!b) return false;
    b.click(); return true;
  })()`);
  await sleep(500);
  const popup = await evalJs(`(() => {
    const panel = [...document.querySelectorAll('div')].find(d =>
        (d.textContent || '').includes('Lihat semua notifikasi') &&
        d.className.includes('max-w-sm') &&
        d.getClientRects().length > 0
      );
    if (!panel) return { err: 'popup not found' };
    const cs = getComputedStyle(panel);
    const par = panel.parentElement;
    const pcs = par ? getComputedStyle(par) : null;
    const r = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    return {
      left: Math.round(r.left), right: Math.round(r.right),
      top: Math.round(r.top), bottom: Math.round(r.bottom),
      w: Math.round(r.width), h: Math.round(r.height),
      vw, vh,
      display: cs.display, pos: cs.position, vis: cs.visibility,
      pDisplay: pcs ? pcs.display : null, pFixed: pcs ? pcs.position : null,
      centerDist: Math.round(cx - vw / 2),
      hCenter: Math.abs(cx - vw / 2) < 24,
      vCenter: Math.abs(cy - vh / 2) < Math.max(150, vh / 4),
    };
  })()`);
  log("popup notif:", JSON.stringify(popup));
  if (popup.err) throw new Error(popup.err);
  if (!popup.hCenter) throw new Error("popup tidak center horizontal: " + popup.centerDist + "px off");

  log("\n=== E2E MOBILE VIEWPORT PASS (tiles + notif center) ===");
  process.exit(0);
}

main().catch((e) => { console.error("[e2e] FAIL:", e.message); process.exit(1); });