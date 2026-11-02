const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs/promises');
const net=require('node:net');
async function main(){
 const root=path.resolve(__dirname,'..');const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});});
 const exe=path.join(root,'dist','KaliwLauncher '+require('../package.json').version+'.exe');const child=spawn(exe,['--disable-gpu','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port],{windowsHide:true,stdio:'ignore'});
 child.on('error',e=>console.error(e));let ws;
 try{
 let page;for(let i=0;i<60;i++){try{const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();page=pages.find(p=>p.type==='page'&&p.url.includes('index.html'));if(page)break;}catch{}await new Promise(r=>setTimeout(r,500));}if(!page)throw Error('Packaged frontend did not open');
 ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});let seq=0;const pending=new Map();ws.onmessage=e=>{const data=JSON.parse(e.data);if(pending.has(data.id)){pending.get(data.id)(data);pending.delete(data.id);}};
 const send=(method,params={})=>new Promise(resolve=>{const id=++seq;pending.set(id,resolve);ws.send(JSON.stringify({id,method,params}));});
 const response=await send('Runtime.evaluate',{expression:`(async()=>{await new Promise((resolve,reject)=>{let tries=0;const check=()=>{if(document.readyState==='complete'&&typeof window.renderHub==='function')return resolve();if(++tries>100)return reject(Error('UI scripts did not initialize'));setTimeout(check,50);};check();});const c=await window.kaliw.read();document.getElementById('skip').click();document.getElementById('settingsNav').click();return {ps1:c.engines.ps1.available,ps2:c.engines.ps2.available,internal:c.emulators.ps1==='integrated'&&c.emulators.ps2==='integrated',biosButtons:document.querySelectorAll('[data-bios]').length,externalPickers:document.querySelectorAll('[data-emulator]').length,settings:document.getElementById('settings').open,catalog:(await window.downloads.catalog(true)).map(e=>e.console),tabs:!!document.getElementById('biosNav')&&!!document.getElementById('onlineHub')};})()`,awaitPromise:true,returnByValue:true});
 if(response.result?.exceptionDetails)throw Error(JSON.stringify(response.result.exceptionDetails));const result=response.result?.result?.value;
 if(!result?.ps1||!result.ps2||!result.internal||result.biosButtons!==2||result.externalPickers!==0||!result.settings||!result.tabs||result.catalog.length!==3||result.catalog.some(c=>!['ps1','ps2'].includes(c)))throw Error('Packaged integration failed: '+JSON.stringify(result));
 console.log('Portable executable passed:',JSON.stringify(result));await fs.writeFile(path.join(root,'artifacts','portable-test-result.json'),JSON.stringify({passed:true,...result},null,2));
 ws.send(JSON.stringify({id:++seq,method:'Runtime.evaluate',params:{expression:'window.close()'}}));await new Promise(r=>setTimeout(r,1200));
 }finally{if(ws?.readyState===1){ws.send(JSON.stringify({id:9999,method:'Runtime.evaluate',params:{expression:'window.close()'}}));await new Promise(r=>setTimeout(r,800));}ws?.close();if(child.exitCode===null)child.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
