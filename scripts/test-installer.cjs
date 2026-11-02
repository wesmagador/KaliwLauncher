const fs=require('fs/promises'),path=require('path'),net=require('net'),assert=require('assert/strict'),{spawn,execFile}=require('child_process');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function socket(page){const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let seq=0;const pending=new Map();ws.onmessage=e=>{const d=JSON.parse(e.data);if(pending.has(d.id)){pending.get(d.id)(d);pending.delete(d.id);}};const send=(method,params)=>new Promise(r=>{const id=++seq;pending.set(id,r);ws.send(JSON.stringify({id,method,params}));});const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.error||r.result?.exceptionDetails)throw Error(JSON.stringify(r.error||r.result.exceptionDetails));return r.result?.result?.value;};return {ws,send,evaluate};}
const run=(exe,args)=>new Promise((resolve,reject)=>execFile(exe,args,{windowsHide:true,windowsVerbatimArguments:true,timeout:240000},(e,out,err)=>e?reject(Error(e.message+' code='+e.code+' signal='+e.signal+' killed='+e.killed+' '+err)):resolve(out)));
(async()=>{
 const root=path.resolve(__dirname,'..'),base=await fs.mkdtemp(path.join(root,'.build-runtime/nsis-test-'));
 const install=path.join(base,'KaliwLauncher'),data=path.join(base,'Dados com acentuação'),setup=path.join(root,'dist/KaliwLauncher-Setup-0.15.0.exe');
 const wait=async(fn)=>{for(let i=0;i<1200;i++){const value=await fn().catch(()=>null);if(value)return value;await sleep(100);}throw Error('Timed out');};
 const installApp=()=>run(setup,['/S','/currentuser','/TRACE=1','/DATA="'+data+'"','/D='+install]);
 await installApp();console.log('Installed into test directory.');
 const {StorageLayout,installedRoot}=require('../storage-layout.cjs');assert.equal(installedRoot(path.join(install,'KaliwLauncher.exe')),data);
 for(const p of require('../platforms.js').platforms)for(const folder of ['BIOS','Jogos'])assert.ok((await fs.stat(path.join(data,'Emuladores',p.id,folder))).isDirectory());
 const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
 let child,main,overlay;const pages=async()=>await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 const open=async()=>{child=spawn(path.join(install,'KaliwLauncher.exe'),['--disable-gpu','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port],{cwd:root,windowsHide:true,stdio:'ignore'});main=await socket(await wait(async()=>(await pages()).find(p=>p.url.includes('index.html'))));await wait(()=>main.evaluate('!!window.kaliw&&!!window.KaliwAudio'));return main;};
 const close=async()=>{main.ws.close();if(child.exitCode===null)await new Promise(r=>execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},r));await wait(async()=>child.exitCode!==null);};
 try{
  await open();assert.equal(await main.evaluate('api.read().then(c=>c.games.length)'),0);
  let rom;for(const d of await fs.readdir(path.join(root,'.build-runtime'))){if(!d.startsWith('multi-test-'))continue;const file=path.join(root,'.build-runtime',d,'kaliw-test.nes');try{await fs.access(file);rom=file;break;}catch{}}assert.ok(rom);
  const game=await main.evaluate(`api.importFiles('nes',[${JSON.stringify(rom)}],'game').then(c=>c.games[0])`);assert.ok(game.path.startsWith(path.join(data,'Emuladores','nes','Jogos')));assert.deepEqual(await fs.readFile(game.path),await fs.readFile(rom));
  await main.evaluate('api.saveAudio({enabled:false,volume:.25})');
  await main.evaluate(`api.launch('nes',${JSON.stringify(game.id)})`);await sleep(600);await main.evaluate('api.openQuickMenu()');
  overlay=await socket(await wait(async()=>(await pages()).find(p=>p.url.includes('quick-menu.html'))));await overlay.evaluate("menu.command('save')");assert.ok(await overlay.evaluate('menu.state().then(s=>s.saved?.bytes>0)'));await overlay.evaluate("menu.command('exit')");overlay.ws.close();overlay=null;console.log('Installed app: managed NES game and save state passed.');await close();
  const userData=path.join(data,'Sistema','Launcher'),before=await fs.readFile(path.join(userData,'library.json'),'utf8');assert.equal(JSON.parse(before).games.length,1);
  await installApp();console.log('Reinstalled using the same data directory.');await open();assert.equal(await main.evaluate('api.read().then(c=>c.games.length)'),1);assert.equal(await main.evaluate('api.getAudio().then(a=>a.enabled)'),false);await close();
  const uninstall=path.join(install,'Uninstall KaliwLauncher.exe');await run(uninstall,['/S','/currentuser','_?='+install]);await wait(async()=>{try{await fs.access(path.join(install,'KaliwLauncher.exe'));return false;}catch{return true;}});
  assert.equal(JSON.parse(await fs.readFile(path.join(userData,'library.json'),'utf8')).games.length,1);await fs.access(game.path);
  await fs.writeFile(path.join(root,'artifacts/installer-test-result.json'),JSON.stringify({passed:true,install,data,unicode:true,platformFolders:15,managedGameCopy:true,nesEmulation:true,saveState:true,reinstallPreservesData:true,uninstallPreservesData:true},null,2));
  console.log('PASS installer: silent install, Unicode data directory, 15 BIOS/game folders, installed NES emulation/save state, reinstall with preserved preferences, uninstall with preserved managed games.');
 }finally{overlay?.ws.close();if(child?.exitCode===null){main?.ws.close();await new Promise(r=>execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},r));}}
})().catch(e=>{console.error(e);process.exitCode=1});
