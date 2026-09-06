/*
 * E2E SIPMA Panel Admin — CDP headless Chrome
 * Flow: login admin20 -> /admin redirect + badge -> /admin/users buat akun petugas
 * & toggle nonaktif -> login akun baru dapat "Akun dinonaktifkan" -> /admin/master
 * tambah kategori -> cek muncul di form aduan -> /admin/settings ubah nama situs
 * -> cek footer -> /admin/login-logs lihat baris login.
 */
"use strict";
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3113";
const PORT = 9331;
const USER_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sipma-admin-e2e-"));

const ADMIN_EMAIL = "admin20@gmail.com";
const ADMIN_PASS = "test123456";
const NEW_EMAIL = "stafadmintest" + Date.now() % 100000 + "@gmail.com";
const NEW_PASS = "sandi12345";

let chrome = null;
let debugUrl = null;
let ws = null;
let msgId = 0;
const pending = new Map();

function log(...a) { console.log("[e2e]", ...a); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function launchChrome() {
  return new Promise((res, rej) => {
    chrome = spawn(CHROME, [
      "--headless=new", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--disable-extensions",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DIR}`,
      "--window-size=1400,1000",
      "about:blank",
    ], { stdio: "ignore" });
    // ambil page target (bukan browser socket) agar Page.* domain valid
    poll2();
    function poll2() {
      http.get(`http://127.0.0.1:${PORT}/json`, (r) => {
        let d = ""; r.on("data", (c) => (d += c));
        r.on("end", () => {
          try {
            const list = JSON.parse(d);
            const page = list.find((t) => t.type === "page");
            if (page) { debugUrl = page.webSocketDebuggerUrl; res(); return; }
            throw new Error("no page target");
          } catch { setTimeout(poll2, 500); }
        });
      }).on("error", () => setTimeout(poll2, 500));
    }
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
  const r = await send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) {
    throw new Error("evalJs: " + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  }
  return r.result.value;
}

// helper: poll until condition true
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

// isi nilai input via native setter (React), pilih select, lalu dispatch
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
  const esc = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = await evalJs(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(selector || "button, a")})];
    const el = els.find(e => (e.textContent || "").trim().includes(${JSON.stringify(text)}));
    if (el) { el.click(); return true; }
    return false;
  })()`);
  if (!found) throw new Error("text not clickable: " + text);
}

async function submit(label) {
  await sleep(1200); // allow transition
}

async function clearAndSet(selector, value) {
  await evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
}

async function main() {
  await launchChrome();
  await connect();
  await send("Page.enable");
  await send("Runtime.enable");

  // --- 1. Login admin
  await goto(BASE + "/login");
  await setValue('input[name="email"]', ADMIN_EMAIL);
  await setValue('input[name="password"]', ADMIN_PASS);
  await clickText("Masuk");
  await waitFor(`location.pathname !== '/login'`, "login redirect", 15000);
  let url = await evalJs("location.pathname");
  log("login admin -> path:", url);
  if (url !== "/admin") throw new Error("expected redirect to /admin, got " + url);
  await waitFor(`document.body.innerText.includes("Admin")`, "admin badge");
  log("OK /admin redirect + badge");

  // --- 2. Buat akun baru (petugas)
  await goto(BASE + "/admin/users");
  await clickText("Tambah Akun");
  await sleep(800);
  await setValue('input[name="fullName"]', "Staf Uji Admin E2E");
  await setValue('input[name="email"]', NEW_EMAIL);
  await setValue('select[name="role"]', "petugas");
  await clearAndSet('input[name="password"]', NEW_PASS);
  await clickText("Simpan");
  await submit();
  // tunggu baris email unik muncul (nama bisa duplikat antar run)
  await waitFor(`document.body.innerText.includes(${JSON.stringify(NEW_EMAIL)})`, "new user row", 20000);
  await sleep(400);
  log("OK akun baru dibuat:", NEW_EMAIL);

  // --- 3. Toggle nonaktif akun baru
  await waitFor(`[...document.querySelectorAll('tbody tr')].some(r => r.innerText.includes(${JSON.stringify(NEW_EMAIL)}))`, "user row present", 15000);
  const tbl = await evalJs(`(() => {
    const rows = [...document.querySelectorAll('table tbody tr')];
    const row = rows.find(r => r.innerText.includes(${JSON.stringify(NEW_EMAIL)}));
    if (!row) return null;
    const btns = [...row.querySelectorAll('button')];
    return { count: btns.length, labels: btns.map(b => b.getAttribute('aria-label')) };
  })()`);
  log("row buttons:", JSON.stringify(tbl));
  await evalJs(`(() => {
    const rows = [...document.querySelectorAll('table tbody tr')];
    const row = rows.find(r => r.innerText.includes(${JSON.stringify(NEW_EMAIL)}));
    const btn = [...row.querySelectorAll('button')].find(b => (b.getAttribute('aria-label')||'').includes('Nonaktifkan'));
    if (btn) btn.click();
    return true;
  })()`);
  await sleep(2000);
  const statusTxt = await evalJs(`(() => {
    const rows = [...document.querySelectorAll('table tbody tr')];
    const row = rows.find(r => r.innerText.includes(${JSON.stringify(NEW_EMAIL)}));
    return row ? row.innerText : '';
  })()`);
  log("after toggle:", statusTxt.includes("Nonaktif") ? "Nonaktif OK" : statusTxt);
  if (!statusTxt.includes("Nonaktif")) throw new Error("user not deactivated");

  // --- 4. Login akun nonaktif harus ditolak
  await goto(BASE + "/login");
  await setValue('input[name="email"]', NEW_EMAIL);
  await setValue('input[name="password"]', NEW_PASS);
  await clickText("Masuk");
  await waitFor(`document.body.innerText.includes("Akun dinonaktifkan")`, "deactivated error", 15000);
  log("OK login akun nonaktif ditolak");

  // login admin lagi (signOut akun nonaktif menghapus session admin)
  await goto(BASE + "/login");
  await setValue('input[name="email"]', ADMIN_EMAIL);
  await setValue('input[name="password"]', ADMIN_PASS);
  await clickText("Masuk");
  await waitFor(`location.pathname === '/admin'`, "admin re-login", 15000);

  // --- 5. Master: tambah kategori
  await goto(BASE + "/admin/master");
  await waitFor(`document.body.innerText.includes("Kategori") && document.body.innerText.includes("Pelaksana")`, "master page", 15000);
  await clickText("Tambah");
  await sleep(800);
  await setValue('input[name="name"]', "Kategori Uji E2E");
  await setValue('input[name="slug"]', "uji-e2e-" + (Date.now() % 100000));
  await clearAndSet('input[name="description"]', "Kategori hasil tes admin");
  await clickText("Simpan");
  await submit();
  await waitFor(`document.body.innerText.includes("Kategori Uji E2E")`, "category row", 15000);
  log("OK kategori ditambah");

  // --- 6. Cek kategori muncul di form aduan masyarakat
  // login sebagai warga (email default warga20)
  await goto(BASE + "/login");
  await setValue('input[name="email"]', "warga20@gmail.com");
  await setValue('input[name="password"]', "test123456");
  await clickText("Masuk");
  await waitFor(`location.pathname === '/masyarakat'`, "warga login", 15000);
  await goto(BASE + "/masyarakat/baru");
  await waitFor(`document.body.innerText.includes("Kategori Aduan")`, "aduan form", 15000);
  const hasCat = await evalJs(`document.body.innerText.includes(${JSON.stringify("Kategori Uji E2E")})`);
  log("kategori di form aduan:", hasCat);
  if (!hasCat) throw new Error("kategori baru tidak muncul di form aduan");
  log("OK kategori muncul di form aduan");

  // --- 7. Settings: ubah nama situs -> footer berubah
  // logout dulu (warga), login admin
  await evalJs(`(() => { const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Keluar')); if(b) b.click(); return true; })()`);
  await sleep(2000);
  await goto(BASE + "/login");
  await setValue('input[name="email"]', ADMIN_EMAIL);
  await setValue('input[name="password"]', ADMIN_PASS);
  await clickText("Masuk");
  await waitFor(`location.pathname === '/admin'`, "admin login for settings", 15000);
  await goto(BASE + "/admin/settings");
  await setValue('input[name="siteName"]', "SIPMA E2E");
  await clickText("Simpan Pengaturan");
  await submit();
  await waitFor(`document.body.innerText.includes("Pengaturan situs disimpan")`, "settings saved", 12000);
  log("OK settings tersimpan");

  // cek footer di halaman publik (keluar admin dulu biar landing publik)
  await goto(BASE + "/");
  const footerName = await evalJs(`(() => {
    const f = document.querySelector('footer');
    return f ? f.innerText.includes('SIPMA E2E') : false;
  })()`);
  log("footer nama berubah:", footerName);
  if (!footerName) throw new Error("footer tidak menampilkan nama baru");
  log("OK footer menampilkan nama situs baru");

  // --- 8. Riwayat login
  await goto(BASE + "/login");
  await setValue('input[name="email"]', ADMIN_EMAIL);
  await setValue('input[name="password"]', ADMIN_PASS);
  await clickText("Masuk");
  await waitFor(`location.pathname === '/admin'`, "admin login for logs", 15000);
  await goto(BASE + "/admin/login-logs");
  await waitFor(`document.body.innerText.includes("Riwayat Login")`, "login logs page");
  const hasLog = await evalJs(`document.body.innerText.includes(${JSON.stringify(ADMIN_EMAIL)})`);
  log("riwayat login berisi email admin:", hasLog);
  const hasIp = await evalJs(`!!document.querySelector('span.font-mono') && (document.querySelector('span.font-mono').textContent.trim().length > 0)`);
  log("ada kolom IP terisi:", hasIp);

  log("\n=== E2E ADMIN ALL PASS ===");
  await sleep(100);
  process.exit(0);
}

main().catch((e) => {
  console.error("[e2e] FAIL:", e.message);
  process.exit(1);
});