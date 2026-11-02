const {app,BrowserWindow,ipcMain,dialog,shell,net}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {EngineManager}=require('./engine-manager.cjs');
const {OnlineManager}=require('./online-manager.cjs');
const {DiscSession}=require('./disc-session.cjs');const {OpticalReader}=require('./optical-reader.cjs');
let win,session=null,sessionInfo=null,sessionBridge=null,launching=false,manager,online,optical;
const sessionCaches=new Set();
const defaults=()=>({games:[],fullboot:true});
const configPath=()=>path.join(app.getPath('userData'),'library.json');
async function raw(){try{return {...defaults(),...JSON.parse(await fs.readFile(configPath(),'utf8'))};}catch(e){if(e.code==='ENOENT')return defaults();throw e;}}
async function read(){const c=await raw(),engines=await manager.status();return {...c,session:sessionInfo,engines,emulators:Object.fromEntries(Object.entries(engines).map(([id,e])=>[id,e.available?'integrated':'']))};}
let saveQueue=Promise.resolve();
function update(change){const task=saveQueue.then(async()=>{const c=await raw();await change(c);await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(configPath()+'.tmp',JSON.stringify(c,null,2));await fs.rename(configPath()+'.tmp',configPath());return read();});saveQueue=task.catch(()=>{});return task;}
const primaryInstance=app.requestSingleInstanceLock();
if(!primaryInstance)app.quit();
app.on('second-instance',()=>{if(win&&!win.isDestroyed()){win.show();win.restore();win.focus();}});
if(primaryInstance)app.whenReady().then(()=>{
 manager=new EngineManager(app.isPackaged?path.join(process.resourcesPath,'engines'):path.join(__dirname,'engines'),path.join(app.getPath('userData'),'emulation'));
 optical=new OpticalReader(manager.bundle,manager.data,event=>{if(win&&!win.isDestroyed())win.webContents.send('optical-progress',event);});
 online=new OnlineManager({data:manager.data,engines:manager,fetcher:(url,options)=>net.fetch(url,options),install:async(entry,file)=>{if(entry.kind==='bios'){if(session||launching)throw Error('Feche o jogo para instalar a BIOS.');await manager.importBios(entry.console,[file]);}else await update(c=>{if(!c.games.some(g=>g.catalogId===entry.id||g.path===file))c.games.push({id:require('node:crypto').randomUUID(),catalogId:entry.id,console:entry.console,path:file,name:entry.name});});},onProgress:progress=>{if(win&&!win.isDestroyed())win.webContents.send('download-progress',progress);}});
 win=new BrowserWindow({width:1440,height:900,minWidth:1000,minHeight:680,backgroundColor:'#0a0c10',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.loadFile('index.html');
 // Keep the frontend alive while a game runs; closing a game returns to Kaliw.
 win.on('close',e=>{if(session||launching){e.preventDefault();win.hide();}});
});
app.on('before-quit',()=>optical?.cancel());
app.on('window-all-closed',()=>{if(!session)app.quit();});
ipcMain.handle('input-snapshot',()=>require('./input-devices.cjs').snapshot());
ipcMain.handle('input-save',(_,value)=>update(c=>{c.controls=require('./input-config.cjs').normalize(value);}));
ipcMain.handle('read',read);
ipcMain.handle('catalog',(_,refresh)=>refresh?online.refresh():online.list());
ipcMain.handle('download',async(_,id)=>{await online.download(id);return {config:await read(),catalog:await online.list()};});
ipcMain.handle('download-cancel',(_,id)=>online.cancel(id));
ipcMain.handle('scan-bios',async()=>{const result=await dialog.showOpenDialog(win,{title:'Pasta para procurar BIOS de PS1 e PS2',properties:['openDirectory']});if(result.canceled)return null;return online.scan(result.filePaths[0]);});
ipcMain.handle('import-found-bios',async(_,id)=>{if(session||launching)throw Error('Feche o jogo antes de importar BIOS.');await online.importCandidate(id);return read();});
ipcMain.handle('catalog-source',async(_,id)=>shell.openExternal(online.entry(id).source));
ipcMain.handle('bios-guide',async()=>shell.openExternal('https://pcsx2.net/docs/setup/bios/'));
ipcMain.handle('bios',async(_,id)=>{manager.check(id);if(session||launching)throw Error('Feche o jogo antes de importar BIOS.');const r=await dialog.showOpenDialog(win,{title:'Importar sua BIOS de '+id.toUpperCase(),filters:[{name:'BIOS descompactada',extensions:['bin']}],properties:['openFile','multiSelections']});if(r.canceled)return null;await manager.importBios(id,r.filePaths);return read();});
ipcMain.handle('select-bios',(_,id,file)=>update(async c=>{manager.check(id);const state=(await manager.status())[id];if(typeof file!=='string'||file&&!state.bios.includes(file))throw Error('BIOS indisponível.');c.bios={...c.bios,[id]:file};}));
ipcMain.handle('remove-bios',async(_,id,file)=>{
 if(session||launching)throw Error('Feche o jogo antes de apagar uma BIOS.');launching=true;
 try{return await update(async c=>{await manager.removeBios(id,file);if(c.bios?.[id]===file)c.bios[id]='';});}finally{launching=false;}
});
ipcMain.handle('data-folder',async()=>{const folder=path.join(app.getPath('userData'),'emulation');await fs.mkdir(folder,{recursive:true});const error=await shell.openPath(folder);if(error)throw Error(error);});
ipcMain.handle('licenses',async()=>{const folder=path.join(manager.bundle,'licenses');const error=await shell.openPath(folder);if(error)throw Error(error);});
ipcMain.handle('import',async(_,id)=>{manager.check(id);const r=await dialog.showOpenDialog(win,{title:'Adicionar jogos de '+id.toUpperCase(),filters:[{name:'Imagens de disco',extensions:id==='ps1'?['cue','chd','pbp','m3u','iso','bin','exe']:['iso','chd','cso','gz','elf','m3u']}],properties:['openFile','multiSelections']});if(r.canceled)return null;return update(c=>{for(const file of r.filePaths)if(!c.games.some(g=>g.path===file&&g.console===id))c.games.push({id:require('node:crypto').randomUUID(),console:id,path:file,name:path.basename(file,path.extname(file))});});});
ipcMain.handle('remove',(_,id)=>update(c=>{c.games=c.games.filter(g=>g.id!==id);}));
ipcMain.handle('boot-mode',(_,enabled)=>update(c=>{c.fullboot=!!enabled;}));
function notifySession(){if(win&&!win.isDestroyed())win.webContents.send('session-changed',sessionInfo);}
async function discPath(file){if(typeof file!=='string'||/[\r\n\0]/.test(file))throw Error('Imagem de disco inválida.');const ext=path.extname(file).toLowerCase();if(!['.bin','.cue','.chd','.iso','.img','.mds','.pbp','.cso','.zso','.gz','.mdf','.nrg'].includes(ext))throw Error('Este arquivo não é uma imagem de CD/DVD inserível. Encerre o console para executar ELF, EXE ou playlists.');await fs.access(file);if(ext==='.bin'){const cue=file.slice(0,-4)+'.cue';try{await fs.access(cue);return cue;}catch{}}return file;}
async function insertDisc(id,game){if(!session||sessionInfo?.console!==id)throw Error('Abra o boot deste console antes de inserir o disco.');const current=session,bridge=sessionBridge;const file=await discPath(game.path);await bridge.command('INSERT',file);if(session!==current)throw Error('O console foi encerrado.');sessionInfo={...sessionInfo,mode:'game',discName:game.name};notifySession();await optical.focus(current.pid);return {inserted:true,session:sessionInfo};}
async function startCore(id,game,c){const plan=await manager.prepare(id,game,game?c.fullboot:true,c);const bridge=new DiscSession(plan.bridge);const child=spawn(plan.exe,plan.args,{cwd:plan.cwd,env:{...process.env,...plan.env},shell:false,stdio:'ignore'});session=child;sessionBridge=bridge;sessionInfo={id:require('node:crypto').randomUUID(),console:id,mode:game?'game':'boot',discName:game?.name||null,bios:plan.bios};notifySession();
 const closed=new Promise((_,reject)=>{child.once('error',error=>reject(Error('Não foi possível iniciar o motor integrado: '+error.message)));child.once('close',code=>{bridge.closed=true;if(session===child){session=null;sessionInfo=null;sessionBridge=null;const caches=[...sessionCaches];sessionCaches.clear();for(const dir of caches)optical.cleanup(dir).catch(()=>{});notifySession();}const error=code!==0?'O motor encerrou com erro. Consulte os logs em Ajustes → Saves e dados.':null;if(win&&!win.isDestroyed()){win.show();win.restore();win.focus();win.webContents.send('returned',{error});}reject(Error(error||'O console foi encerrado.'));});});
 try{await Promise.race([bridge.command('PING','',30000),closed]);if(session!==child)throw Error('O console foi encerrado.');win.minimize();return {inserted:false,session:sessionInfo};}catch(e){if(session===child){child.kill();session=null;sessionInfo=null;sessionBridge=null;bridge.closed=true;notifySession();}throw e;}
}
async function stopCore(){if(!session)return;const child=session,bridge=sessionBridge;let timer;const closed=new Promise(resolve=>child.once('close',resolve));await bridge.command('QUIT','',10000);try{await Promise.race([closed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Feche a janela do console para continuar.')),10000);})]);}finally{clearTimeout(timer);}}
ipcMain.handle('launch',async(_,id,gameId)=>{manager.check(id);if(launching)throw Error('Aguarde a operação atual do console.');launching=true;try{await saveQueue;const c=await raw(),game=gameId?c.games.find(g=>g.id===gameId&&g.console===id):null;if(gameId&&!game)throw Error('Jogo não encontrado.');if(session){if(sessionInfo.console!==id)throw Error('Encerre o console aberto para iniciar outra plataforma.');if(game)return await insertDisc(id,game);await optical.focus(session.pid);return {session:sessionInfo};}return await startCore(id,game,c);}finally{launching=false;}});
ipcMain.handle('session-focus',async()=>{if(session)await optical.focus(session.pid);});
ipcMain.handle('session-stop',async()=>{if(launching)throw Error('Aguarde a operação atual do console.');launching=true;try{await stopCore();return read();}finally{launching=false;}});
ipcMain.handle('session-restart',async()=>{if(launching||!sessionInfo)throw Error('Aguarde ou inicie um console.');launching=true;const id=sessionInfo.console;try{await stopCore();await saveQueue;return await startCore(id,null,await raw());}finally{launching=false;}});
ipcMain.handle('session-eject',async()=>{if(!session||launching)throw Error('Abra um console e aguarde a operação atual.');if(sessionInfo.console!=='ps1')throw Error('No PS2, escolha outro disco para trocar a mídia.');await sessionBridge.command('EJECT');sessionInfo={...sessionInfo,discName:null};notifySession();});
ipcMain.handle('session-insert-file',async()=>{if(!sessionInfo||launching)throw Error('Abra o boot do console primeiro.');const id=sessionInfo.console;const result=await dialog.showOpenDialog(win,{title:'Inserir CD/DVD em '+id.toUpperCase(),properties:['openFile'],filters:[{name:'Imagem de CD/DVD',extensions:id==='ps1'?['cue','chd','bin','iso','img','pbp']:['iso','chd','cso','zso','gz','bin','cue']}]});if(result.canceled)return null;if(launching||!session||sessionInfo.console!==id)throw Error('O console foi encerrado ou está ocupado.');launching=true;try{const file=await discPath(result.filePaths[0]);let game;await update(c=>{game=c.games.find(g=>g.path===file&&g.console===id);if(!game){game={id:require('node:crypto').randomUUID(),console:id,path:file,name:path.basename(file,path.extname(file))};c.games.push(game);}});await insertDisc(id,game);return read();}finally{launching=false;}});
ipcMain.handle('optical-drives',()=>optical.drives());
ipcMain.handle('optical-cancel',()=>optical.cancel());
ipcMain.handle('optical-play',async(_,id,drive)=>{manager.check(id);if(launching)throw Error('Aguarde a operação atual do console.');if(sessionInfo&&sessionInfo.console!==id)throw Error('Encerre o console aberto para usar outra plataforma.');launching=true;const original=session;let image;try{await saveQueue;const c=await raw();if(!(await manager.status())[id].bios.length)throw Error('Importe a BIOS deste console antes de ler o disco.');image=await optical.read(drive);if(original&&session!==original)throw Error('O console foi encerrado durante a leitura.');sessionCaches.add(image.cache);if(session){await insertDisc(id,image);return {session:sessionInfo};}await saveQueue;return await startCore(id,image,await raw());}catch(e){if(image){sessionCaches.delete(image.cache);await optical.cleanup(image.cache).catch(()=>{});}throw e;}finally{launching=false;}});
ipcMain.handle('save-video',async(_,buffer)=>{const r=await dialog.showSaveDialog(win,{defaultPath:'Kaliw-boot.webm',filters:[{name:'Vídeo WebM',extensions:['webm']}]});if(r.canceled)return false;await fs.writeFile(r.filePath,Buffer.from(buffer));return true;});
