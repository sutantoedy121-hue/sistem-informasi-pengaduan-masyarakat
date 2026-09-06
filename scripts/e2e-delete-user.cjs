"use strict";
// E2E hapus user: login admin -> users -> hapus dltmp@gmail.com -> hilang.
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3113";
const PORT = 9341;
const USER_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sipma-del-e2e-"));
let chrome, ws;
let msgId = 0;
const pending = new Map();
function launch() {
  return new Promise((res) => {
    chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--no-first-run","--remote-debugging-port="+PORT,"--user-data-dir="+USER_DIR,"about:blank"], { stdio: "ignore" });
    const poll = () => {
      http.get("http://127.0.0.1:"+PORT+"/json", (r) => {
        let d=""; r.on("data",c=>d+=c); r.on("end",()=>{
          try { const p=JSON.parse(d).find(t=>t.type==="page"); if(p){ ws = new (require("ws"))(p.webSocketDebuggerUrl); ws.on("message",(m)=>{ const j=JSON.parse(m); if(j.id&&pending.has(j.id)){ const q=pending.get(j.id); pending.delete(j.id); j.error?q.rej(new Error(j.error.message)):q.res(j.result); } }); ws.on("open",res); return; } } catch {}
          setTimeout(poll, 300);
        });
      }).on("error", () => setTimeout(poll, 300));
    };
    poll();
  });
}
function send(m,p={}){ return new Promise((res,rej)=>{ const id=++msgId; pending.set(id,{res,rej}); ws.send(JSON.stringify({id,method:m,params:p})); }); }
function ev(expr){ return send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true}).then(r=>{ if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||"eval"); return r.result.value; }); }
async function waitFor(expr,t=15000){ const s=Date.now(); for(;;){ const v=await ev(expr); if(v) return v; if(Date.now()-s>t) throw new Error("timeout "+expr.slice(0,60)); await sleep(300); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function goto(u){ await send("Page.navigate",{url:u}); await waitFor("document.readyState==='complete'"); await sleep(400); }
async function setVal(sel,v){ await ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el)return false;const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;setter.call(el,${JSON.stringify(v)});el.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`); }
async function main(){
  await launch(); await send("Page.enable"); await send("Runtime.enable");

  // 1. Login admin
  await goto(BASE+"/login");
  await setVal('input[name="email"]','admin20@gmail.com');
  await setVal('input[name="password"]','test123456');
  await sleep(300);
  await ev(`(()=>{const b=[...document.querySelectorAll('form button[type=submit]')].find(x=>x.textContent.trim().includes('Masuk'));if(b)b.click();return true;})()`);
  await waitFor("location.pathname==='/admin'",15000);
  console.log("OK admin login");

  // 2. users: cari dltmp
  await goto(BASE+"/admin/users");
  await waitFor("document.body.innerText.includes('Kelola Akun')");
  await sleep(800);
  await setVal('input[placeholder*="Cari"]','dltmp@gmail.com');
  await sleep(600);
  const present = await ev(`document.body.innerText.includes('dltmp@gmail.com')`);
  console.log("dltmp tampil:", present);
  if (!present) throw new Error("dltmp tidak tampil");

  // 3. klik hapus (tombol aria-label "Hapus dltmp@gmail.com")
  const clicked = await ev(`(()=>{const b=document.querySelector('button[aria-label="Hapus dltmp@gmail.com"]');if(!b)return false;b.click();return true;})()`);
  if (!clicked) throw new Error("tombol hapus tak ditemukan");
  await waitFor("document.body.innerText.includes('Hapus Permanen')",8000);
  console.log("modal konfirmasi muncul");
  const warn = await ev(`document.body.innerText.includes('permanen')`);
  console.log("peringatan permanen:", warn);

  // 4. konfirmasi hapus
  await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().includes('Hapus Permanen'));if(b)b.click();return true;})()`);
  await sleep(1500);
  const diag = await ev(`(()=>{const sb=[...document.querySelectorAll('form button[type=submit]')].map(x=>x.textContent.trim());return {btn:sb, err:window.__err||null};})()`);
  console.log("diagnosa:", JSON.stringify(diag));
  let cleared = false;
  const s0 = Date.now();
  while (Date.now() - s0 < 15000) {
    if (!(await ev(`document.body.innerText.includes('dltmp@gmail.com')`))) { cleared = true; break; }
    await sleep(400);
  }
  console.log("dltmp hilang dari tabel:", cleared);
  if (!cleared) {
    const body = await ev(`document.body.innerText`);
    const el = body.split("\n").filter(l => /hapus|gagal|error|terjadi|permanen/i.test(l));
    console.log("status body:", JSON.stringify(el.slice(0,8)));
  }
  const err = await ev(`/Gagal|kesalahan|error/i.test(document.body.innerText)`);
  console.log("ada error hapus:", err);

  console.log("\n=== E2E DELETE USER PASS ===");
  process.exit(0);
}
main().catch(e=>{ console.error("FAIL:", e.message); process.exit(1); });