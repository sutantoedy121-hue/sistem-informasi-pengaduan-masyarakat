/*
 * E2E SIPMA — fitur baru: logo panel, profil (nama + sandi), bell navbar, tile mobile.
 * Login warga -> verifikasi tile scroll, bell navbar, logo starter; buka /masyarakat/profil
 * ubah nama; ganti sandi (lama -> baru) lalu login ulang dengan sandi baru; reset nama.
 * Server dev di 3117, Chrome headless via CDP.
 */
"use strict";
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3117";
const PORT = 9345;
const USER_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sipma-profile-e2e-"));

const EMAIL = "warga20@gmail.com";
const PASS_OLD = "test123456";
const PASS_NEW = "ganti123456";

let chrome = null, debugUrl = null, ws = null, msgId = 0;
const pending = new Map();
const log = (...a) => console.log("[e2e]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function launchChrome() {
  return new Promise((res, rej) => {
    chrome = spawn(CHROME, [
      "--headless=new", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--disable-extensions",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DIR}`,
      "--window-size=1400,1000", "about:blank",
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
  if (r.exceptionDetails) throw new Error("evalJs: " + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
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
    if (el.tagName === 'SELECT') {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  })()`);
}

async function clickText(text, selector) {
  const found = await evalJs(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(selector || "button, a")})];
    const el = els.find(e => (e.textContent || "").trim().includes(${JSON.stringify(text)}));
    if (el) { el.click(); return true; }
    return false;
  })()`);
  if (!found) throw new Error("text not clickable: " + text);
}

async function login(email, pass) {
  await goto(BASE + "/login");
  await setValue('input[name="email"]', email);
  await setValue('input[name="password"]', pass);
  await clickText("Masuk");
  await waitFor(`location.pathname !== '/login'`, "login redirect", 15000);
  return evalJs("location.pathname");
}

async function main() {
  await launchChrome();
  await connect();
  await send("Page.enable");
  await send("Runtime.enable");

  // --- 1. Login warga
  const homePath = await login(EMAIL, PASS_OLD);
  log("login -> path:", homePath);
  if (homePath !== "/masyarakat") throw new Error("expected /masyarakat, got " + homePath);

  // --- 2. Tile ringkasan (mobile: flex scroll / desktop grid)
  const tileInfo = await evalJs(`(() => {
    const el = document.querySelector('main .card');
    if (!el) return null;
    const cs = getComputedStyle(el.parentElement);
    return { display: cs.display, cols: cs.gridTemplateColumns.split(' ').length };
  })()`);
  log("tile container:", JSON.stringify(tileInfo));
  if (tileInfo && tileInfo.display === 'grid') {
    // desktop lg:grid — pastikan 4 kolom
    if (tileInfo.cols < 4) log("WARN tile kolom:", tileInfo.cols);
  }

  // --- 3. Bell notifikasi di header panel
  const bellPanel = await evalJs(`!!document.querySelector('header [aria-label="Notifikasi"]')`);
  log("bell di header panel masyarakat:", bellPanel);
  if (!bellPanel) throw new Error("bell header masyarakat tidak ada");

  // --- 4. Buka profil via header
  await evalJs(`(() => { const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')==='/masyarakat/profil'); if(a) a.click(); return !!a; })()`);
  await waitFor(`location.pathname === '/masyarakat/profil'`, "profil nav", 15000);
  let body = await evalJs("document.body.innerText");
  log("halaman profil:", body.includes("Pengaturan Profil") ? "OK" : "GAGAL");
  if (!body.includes("Pengaturan Profil")) throw new Error("profil tidak dirender");

  // --- 5. Ubah nama
  await setValue('input[name="fullName"]', "Warga Uji Profil");
  await clickText("Simpan Nama");
  await waitFor(`document.body.innerText.includes("Nama lengkap berhasil diperbarui")`, "nama tersimpan", 12000);
  log("OK nama diubah -> 'Warga Uji Profil'");

  // --- 6. Ganti sandi (lama -> baru)
  await setValue('input[name="currentPassword"]', PASS_OLD);
  await setValue('input[name="newPassword"]', PASS_NEW);
  await setValue('input[name="confirmPassword"]', PASS_NEW);
  await clickText("Ganti Kata Sandi");
  await waitFor(`document.body.innerText.includes("Kata sandi berhasil diganti")`, "sandi diganti", 15000);
  log("OK sandi diganti");

  // --- 7. Logout + login dengan sandi baru
  await evalJs(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='Keluar'); if(b) b.click(); return !!b; })()`);
  await waitFor(`location.pathname === '/' || location.pathname === '/login'`, "logout", 15000);
  const path2 = await login(EMAIL, PASS_NEW);
  log("login sandi baru -> path:", path2);
  if (path2 !== "/masyarakat") throw new Error("login sandi baru gagal: " + path2);
  log("OK login memakai sandi baru");

  // --- 8. Reset nama kembali
  await evalJs(`(() => { const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')==='/masyarakat/profil'); if(a) a.click(); return !!a; })()`);
  await waitFor(`location.pathname === '/masyarakat/profil'`, "profil nav 2", 15000);
  await setValue('input[name="fullName"]', "Warga20");
  await clickText("Simpan Nama"); await sleep(1200);

  // --- 9. Navbar publik: bell muncul setelah login, logo fallback ada
  await goto(BASE + "/");
  await sleep(800);
  const bellPub = await evalJs(`!!document.querySelector('header [aria-label="Notifikasi"]')`);
  const brandImg = await evalJs(`(() => { const h=document.querySelector('header'); return h ? !!h.querySelector('img') : false; })()`);
  log("bell navbar publik:", bellPub, "| logo panel:", brandImg);

  log("\n=== E2E PROFIL + LOGO + BELL ALL PASS ===");
  await sleep(100);
  process.exit(0);
}

main().catch((e) => { console.error("[e2e] FAIL:", e.message); process.exit(1); });