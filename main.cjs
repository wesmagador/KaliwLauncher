const {app,BrowserWindow,ipcMain,dialog,shell,net}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {EngineManager}=require('./engine-manager.cjs');
const {OnlineManager}=require('./online-manager.cjs');
let win,session=null,launching=false,manager,online;
const defaults=()=>({games:[],fullboot:true});
const configPath=()=>path.join(app.getPath('userData'),'library.json');
async function raw(){try{return {...defaults(),...JSON.parse(await fs.readFile(configPath(),'utf8'))};}catch(e){if(e.code==='ENOENT')return defaults();throw e;}}
async function read(){const c=await raw(),engines=await manager.status();return {...c,engines,emulators:Object.fromEntries(Object.entries(engines).map(([id,e])=>[id,e.available?'integrated':'']))};}
let saveQueue=Promise.resolve();
function update(change){const task=saveQueue.then(async()=>{const c=await raw();await change(c);await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(configPath()+'.tmp',JSON.stringify(c,null,2));await fs.rename(configPath()+'.tmp',configPath());return read();});saveQueue=task.catch(()=>{});return task;}
app.whenReady().then(()=>{
 manager=new EngineManager(app.isPackaged?path.join(process.resourcesPath,'engines'):path.join(__dirname,'engines'),path.join(app.getPath('userData'),'emulation'));
 online=new OnlineManager({data:manager.data,engines:manager,fetcher:(url,options)=>net.fetch(url,options),install:async(entry,file)=>{if(entry.kind==='bios'){if(session||launching)throw Error('Feche o jogo para instalar a BIOS.');await manager.importBios(entry.console,[file]);}else await update(c=>{if(!c.games.some(g=>g.catalogId===entry.id||g.path===file))c.games.push({id:require('node:crypto').randomUUID(),catalogId:entry.id,console:entry.console,path:file,name:entry.name});});},onProgress:progress=>{if(win&&!win.isDestroyed())win.webContents.send('download-progress',progress);}});
 win=new BrowserWindow({width:1440,height:900,minWidth:1000,minHeight:680,backgroundColor:'#0a0c10',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.loadFile('index.html');
 // Keep the frontend alive while a game runs; closing a game returns to Kaliw.
 win.on('close',e=>{if(session||launching){e.preventDefault();win.hide();}});
});
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
ipcMain.handle('launch',async(_,id,gameId)=>{
 if(session||launching)throw Error('Um jogo já está em execução. Feche-o para iniciar outro.');manager.check(id);launching=true;
 try{
 const c=await raw(),game=gameId?c.games.find(g=>g.id===gameId&&g.console===id):null;if(gameId&&!game)throw Error('Jogo não encontrado');
 const launch=await manager.prepare(id,game,game?c.fullboot:true,c);
 await new Promise((resolve,reject)=>{
  let settled=false;const child=spawn(launch.exe,launch.args,{cwd:launch.cwd,shell:false,stdio:'ignore'});session=child;
  const timer=setTimeout(()=>{settled=true;win.minimize();resolve(true);},1500);
  child.once('error',error=>{clearTimeout(timer);session=null;if(!settled){settled=true;reject(Error('Não foi possível iniciar o motor integrado: '+error.message));}});
  child.once('close',code=>{clearTimeout(timer);if(session===child)session=null;const error=code!==0?`O motor de ${id.toUpperCase()} encerrou com erro. Consulte a pasta logs em Ajustes → Saves e dados.`:null;
   if(!settled){settled=true;reject(Error(error||'O motor encerrou antes de iniciar. Consulte os logs em Ajustes → Saves e dados.'));}
   if(win&&!win.isDestroyed()){win.show();win.restore();win.focus();win.webContents.send('returned',{error});}
  });
 });return true;
 }finally{launching=false;}
});
ipcMain.handle('save-video',async(_,buffer)=>{const r=await dialog.showSaveDialog(win,{defaultPath:'Kaliw-boot.webm',filters:[{name:'Vídeo WebM',extensions:['webm']}]});if(r.canceled)return false;await fs.writeFile(r.filePath,Buffer.from(buffer));return true;});
