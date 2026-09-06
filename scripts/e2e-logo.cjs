"use strict";
// E2E logo site: login admin -> settings upload logo -> simpan -> cek footer
// & navbar memakai gambar -> master tanpa modul Wilayah.
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3113";
const PORT = 9340;
const USER_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sipma-logo-e2e-"));
let chrome, debugUrl, ws;
let msgId = 0;
const pending = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function launch() {
  return new Promise((res) => {
    chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--no-first-run","--remote-debugging-port="+PORT,"--user-data-dir="+USER_DIR,"about:blank"], { stdio: "ignore" });
    const poll = () => {
      http.get("http://127.0.0.1:"+PORT+"/json", (r) => {
        let d=""; r.on("data",c=>d+=c); r.on("end",()=>{
          try { const p=JSON.parse(d).find(t=>t.type==="page"); if(p){ debugUrl=p.webSocketDebuggerUrl; return res(); } } catch {}
          setTimeout(poll, 300);
        });
      }).on("error", () => setTimeout(poll, 300));
    };
    poll();
  });
}
async function send(m,p={}){ return new Promise((res,rej)=>{ const id=++msgId; pending.set(id,{res,rej}); ws.send(JSON.stringify({id,method:m,params:p})); }); }
function connect(){ return new Promise((res)=>{ const WS=require("ws"); ws=new WS(debugUrl); ws.on("open",()=>{ ws.on("message",(r)=>{ const m=JSON.parse(r); if(m.id&&pending.has(m.id)){ const p=pending.get(m.id); pending.delete(m.id); m.error?p.rej(new Error(m.error.message)):p.res(m.result); } }); res(); }); }); }
function ev(expr){ return send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true}).then(r=>{ if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||"eval"); return r.result.value; }); }
async function waitFor(expr,t=15000){ const s=Date.now(); for(;;){ const v=await ev(expr); if(v) return v; if(Date.now()-s>t) throw new Error("timeout "+expr.slice(0,60)); await sleep(300); } }
async function goto(u){ await send("Page.navigate",{url:u}); await waitFor("document.readyState==='complete'"); await sleep(400); }
async function setVal(sel,v){ await ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el)return false;const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;setter.call(el,${JSON.stringify(v)});el.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`); }
async function clickTxt(t){ const ok=await ev(`(()=>{const e=[...document.querySelectorAll('button, a')].find(x=>(x.textContent||'').trim().includes(${JSON.stringify(t)}));if(e){e.click();return true;}return false;})()`); if(!ok) throw new Error("not clickable: "+t); }
async function main(){
  await launch(); await connect(); await send("Page.enable"); await send("Runtime.enable");
  console.log("path cwd:", process.cwd());

  // 1. Login admin
  await goto(BASE+"/login");
  await setVal('input[name="email"]','admin20@gmail.com');
  await setVal('input[name="password"]','test123456');
  await sleep(300);
  const clicked = await ev(`(()=>{const b=[...document.querySelectorAll('form button[type=submit]')].find(x=>x.textContent.trim().includes('Masuk'));if(!b)return false;b.click();return true;})()`);
  if (!clicked) throw new Error("submit button not found");
  await waitFor("location.pathname==='/admin'",15000);
  console.log("OK admin login");

  // 2. Master: pastikan Wilayah hilang
  await goto(BASE+"/admin/master");
  await waitFor("document.body.innerText.includes('Data Master')");
  await sleep(800);
  const hasWilayah = await ev(`document.body.innerText.includes('Wilayah') && document.body.innerText.includes('Kecamatan')`);
  console.log("modul Wilayah simpang:", hasWilayah);
  if (hasWilayah) throw new Error("Wilayah masih ada di master");

  // 3. Settings: upload logo via input file (CDP DOM.setFileInputFiles)
  await goto(BASE+"/admin/settings");
  await waitFor("document.body.innerText.includes('Logo Situs')",12000);
  await send("DOM.enable");
  const { root } = await send("DOM.getDocument");
  const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: "input[type=file]" });
  if (!nodeId) throw new Error("input file tak ditemukan");
  await send("DOM.setFileInputFiles", { nodeId, files: [path.resolve("scripts/logo-test.png")] });
  await sleep(3000); // upload client->bucket site-assets
  const previ = await ev(`!!document.querySelector('img[src*="site-assets"], img[src*="logo-"]')`);
  console.log("preview logo muncul:", previ);
  if (!previ) throw new Error("preview tidak muncul");
  await clickTxt("Simpan Pengaturan");
  await waitFor("document.body.innerText.includes('Pengaturan situs disimpan')",12000);
  console.log("OK logo tersimpan");

  // 4. Footer pakai logo
  await goto(BASE+"/");
  await waitFor("document.querySelector('footer')!==null");
  await sleep(600);
  const footerLogo = await ev(`(()=>{const f=document.querySelector('footer');const im=f?f.querySelector('img[src*="site-assets"]'):null;return !!im;})()`);
  console.log("footer logo:", footerLogo);
  if (!footerLogo) throw new Error("footer tanpa logo");

  // 5. Navbar logo
  const navLogo = await ev(`(()=>{const im=document.querySelector('header img[src*="site-assets"]');return !!im;})()`);
  console.log("navbar logo:", navLogo);
  if (!navLogo) throw new Error("navbar tanpa logo");

  // 6. Bersihkan logo (balikin tanpa logo) biar bersih — optional; biarkan terpasang? Reset ke null
  await goto(BASE+"/admin/settings");
  await waitFor("document.body.innerText.includes('Logo Situs')");
  await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Hapus logo'));if(b)b.click();return true;})()`);
  await sleep(500);
  await clickTxt("Simpan Pengaturan");
  await waitFor("document.body.innerText.includes('Pengaturan situs disimpan')",12000);
  await goto(BASE+"/");
  await waitFor("document.querySelector('footer')!==null");
  await sleep(600);
  console.log("footer logo after clear:", await ev(`!!document.querySelector('footer img[src*="site-assets"]')`));

  console.log("\n=== E2E LOGO PASS ===");
  process.exit(0);
}
main().catch(e=>{ console.error("FAIL:", e.message); process.exit(1); });