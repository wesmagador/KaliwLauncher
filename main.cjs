const {app,BrowserWindow,ipcMain,dialog,shell,net}=require('electron');

const fs=require('node:fs/promises');

const path=require('node:path');

const {spawn}=require('node:child_process');

const {EngineManager}=require('./engine-manager.cjs');

const {platforms}=require('./platforms.js');

const {OnlineManager}=require('./online-manager.cjs');

const {QuickMenuManager}=require('./quick-menu-manager.cjs');const Shortcuts=require('./shortcuts.js');const crypto=require('node:crypto');

const {DiscSession}=require('./disc-session.cjs');const {OpticalReader}=require('./optical-reader.cjs');

let win,session=null,sessionInfo=null,sessionBridge=null,launching=false,manager,online,optical,quickMenu,sessionContent='',sessionStateIdentity='';

let currentShortcuts=Shortcuts.defaults(),currentTheme='kaliw';

const sessionCaches=new Set();

const defaults=()=>({games:[],fullboot:true});

const configPath=()=>path.join(app.getPath('userData'),'library.json');

async function raw(){try{return {...defaults(),...JSON.parse(await fs.readFile(configPath(),'utf8'))};}catch(e){if(e.code==='ENOENT')return defaults();throw e;}}

async function read(){const c=await raw(),engines=await manager.status();return {...c,session:sessionInfo,engines,emulators:Object.fromEntries(Object.entries(engines).map(([id,e])=>[id,e.available?'integrated':'']))};}

let saveQueue=Promise.resolve();

function update(change){const task=saveQueue.then(async()=>{const c=await raw();await change(c);await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(configPath()+'.tmp',JSON.stringify(c,null,2));await fs.rename(configPath()+'.tmp',configPath());return read();});saveQueue=task.catch(()=>{});return task;}

let gameImporter;function imports(){return gameImporter||(gameImporter=new (require('./game-import-manager.cjs').GameImportManager)(manager.data,manager.bundle,progress=>{if(win&&!win.isDestroyed())win.webContents.send('import-progress',progress);}));}
async function addImportedGames(id,files){const prepared=await imports().resolve(id,files,(await raw()).games);return update(c=>{for(const entry of prepared){const found=c.games.find(g=>g.console===id&&(g.path===entry.path||entry.gameKey&&g.gameKey===entry.gameKey));if(found)Object.assign(found,entry);else c.games.push({id:crypto.randomUUID(),...entry});}});}
const primaryInstance=app.requestSingleInstanceLock();

if(!primaryInstance)app.quit();

app.on('second-instance',()=>{if(win&&!win.isDestroyed()){win.show();win.restore();win.focus();}});

if(primaryInstance)app.whenReady().then(()=>{

 manager=new EngineManager(app.isPackaged?path.join(process.resourcesPath,'engines'):path.join(__dirname,'engines'),path.join(app.getPath('userData'),'emulation'));

 optical=new OpticalReader(manager.bundle,manager.data,event=>{if(win&&!win.isDestroyed())win.webContents.send('optical-progress',event);});

 quickMenu=new QuickMenuManager({theme:()=>currentTheme,session:()=>sessionInfo,ready:()=>!launching,stateFile:quickStateFile,shortcuts:()=>currentShortcuts,focus:()=>session?optical.focus(session.enginePid||session.pid):null,stop:()=>stopFromMenu(),restart:()=>restartFromMenu(),games:async()=>{const c=await raw();return c.games.filter(g=>g.console===sessionInfo?.console).map(g=>({id:g.id,name:g.name,current:g.path===sessionContent}));},selectGame:id=>selectQuickGame(id),onError:error=>{if(win&&!win.isDestroyed())win.webContents.send('quick-error',error.message);}});

 online=new OnlineManager({data:manager.data,engines:manager,fetcher:(url,options)=>net.fetch(url,options),install:async(entry,file)=>{if(entry.kind==='bios'){if(session||launching)throw Error('Feche o jogo para instalar a BIOS.');await manager.importBios(entry.console,[file]);}else await update(c=>{if(!c.games.some(g=>g.catalogId===entry.id||g.path===file))c.games.push({id:require('node:crypto').randomUUID(),catalogId:entry.id,console:entry.console,path:file,name:entry.name});});},onProgress:progress=>{if(win&&!win.isDestroyed())win.webContents.send('download-progress',progress);}});

 win=new BrowserWindow({width:1440,height:900,minWidth:1000,minHeight:680,backgroundColor:'#0a0c10',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});

 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.loadFile('index.html');

 // Keep the frontend alive while a game runs; closing a game returns to Kaliw.

 win.on('close',e=>{if(session||launching){e.preventDefault();win.hide();}else quickMenu?.destroy();});

});

app.on('before-quit',()=>{optical?.cancel();quickMenu?.destroy();});

app.on('window-all-closed',()=>{if(!session)app.quit();});

ipcMain.handle('input-snapshot',()=>require('./input-devices.cjs').snapshot());

ipcMain.handle('input-save',async(_,value)=>{const result=await update(c=>{c.controls=require('./input-config.cjs').normalize(value);});currentShortcuts=Shortcuts.normalize(result.controls.shortcuts);if(sessionBridge&&!sessionBridge.closed)await sessionBridge.command('BINDINGS',shortcutBindings(currentShortcuts));return result;});

ipcMain.handle('read',read);

ipcMain.handle('catalog',(_,refresh)=>refresh?online.refresh():online.list());

ipcMain.handle('download',async(_,id)=>{await online.download(id);return {config:await read(),catalog:await online.list()};});

ipcMain.handle('download-cancel',(_,id)=>online.cancel(id));

ipcMain.handle('scan-bios',async()=>{const result=await dialog.showOpenDialog(win,{title:'Pasta para procurar BIOS de PS1 e PS2',properties:['openDirectory']});if(result.canceled)return null;return online.scan(result.filePaths[0]);});

ipcMain.handle('import-found-bios',async(_,id)=>{if(session||launching)throw Error('Feche o jogo antes de importar BIOS.');await online.importCandidate(id);return read();});

ipcMain.handle('catalog-source',async(_,id)=>shell.openExternal(online.entry(id).source));

ipcMain.handle('bios-guide',async()=>shell.openExternal('https://pcsx2.net/docs/setup/bios/'));

ipcMain.handle('bios',async(_,id)=>{manager.check(id);if(session||launching)throw Error('Feche o jogo antes de importar BIOS.');const r=await dialog.showOpenDialog(win,{title:'Importar sua BIOS de '+id.toUpperCase(),filters:[{name:'BIOS principal descompactada',extensions:manager.biosExtensions(id)}],properties:['openFile','multiSelections']});if(r.canceled)return null;await manager.importBios(id,r.filePaths);return read();});

ipcMain.handle('select-bios',(_,id,file)=>update(async c=>{manager.check(id);const state=(await manager.status())[id];if(typeof file!=='string'||file&&!state.bios.includes(file))throw Error('BIOS indisponível.');c.bios={...c.bios,[id]:file};}));

ipcMain.handle('remove-bios',async(_,id,file)=>{

 if(session||launching)throw Error('Feche o jogo antes de apagar uma BIOS.');launching=true;

 try{return await update(async c=>{await manager.removeBios(id,file);if(c.bios?.[id]===file)c.bios[id]='';});}finally{launching=false;}

});

ipcMain.handle('data-folder',async()=>{const folder=path.join(app.getPath('userData'),'emulation');await fs.mkdir(folder,{recursive:true});const error=await shell.openPath(folder);if(error)throw Error(error);});

ipcMain.handle('licenses',async()=>{const folder=path.join(manager.bundle,'licenses');const error=await shell.openPath(folder);if(error)throw Error(error);});

ipcMain.handle('import',async(_,id)=>{manager.check(id);const r=await dialog.showOpenDialog(win,{title:'Adicionar jogos de '+id.toUpperCase(),filters:[{name:'Imagens de disco',extensions:manager.check(id).extensions}],properties:['openFile','multiSelections']});if(r.canceled)return null;return addImportedGames(id,r.filePaths);});

ipcMain.handle('remove',(_,id)=>update(c=>{c.games=c.games.filter(g=>g.id!==id);}));

ipcMain.handle('boot-mode',(_,enabled)=>update(c=>{c.fullboot=!!enabled;}));

function notifySession(){if(win&&!win.isDestroyed())win.webContents.send('session-changed',sessionInfo);}

async function discPath(file){if(typeof file!=='string'||/[\r\n\0]/.test(file))throw Error('Imagem de disco inválida.');const ext=path.extname(file).toLowerCase();if(!['.bin','.cue','.chd','.iso','.img','.mds','.pbp','.cso','.zso','.gz','.mdf','.nrg'].includes(ext))throw Error('Este arquivo não é uma imagem de CD/DVD inserível. Encerre o console para executar ELF, EXE ou playlists.');await fs.access(file);if(ext==='.bin'){const cue=file.slice(0,-4)+'.cue';try{await fs.access(cue);return cue;}catch{}}return file;}

async function insertDisc(id,game){if(!session||sessionInfo?.console!==id)throw Error('Abra o boot deste console antes de inserir o disco.');const current=session,bridge=sessionBridge;const file=await discPath(game.path);await bridge.command('INSERT',file);if(session!==current)throw Error('O console foi encerrado.');sessionContent=game.path;sessionInfo={...sessionInfo,mode:'game',discName:game.name};notifySession();await optical.focus(current.pid);return {inserted:true,session:sessionInfo};}

async function startCore(id,game,c,operation=null){const plan=operation?await manager.modern.prepare(id,game,c,operation):await manager.prepare(id,game,game?c.fullboot:true,c);const identity=crypto.createHash('sha256').update(await fs.readFile(plan.identity||plan.env.KALIW_CORE)).update('|'+id+'|'+(c.bios?.[id]||(await manager.status())[id].bios.join('|'))).digest('hex');const bridge=new DiscSession(plan.bridge);const pointer=id==='wii'&&require('./input-config.cjs').normalize(c.controls).wiiPointer==='touchpad'?new(require('./wii-pointer.cjs').WiiPointer)(c.controls):null;const child=spawn(plan.exe,plan.args,{cwd:plan.cwd,env:{...process.env,...plan.env,...pointer?.env,KALIW_SDL:path.join(manager.bundle,'SDL2.dll')},shell:false,stdio:['ignore','pipe','pipe']});if(pointer){pointer.start();child.once('close',()=>pointer.dispose());}const logDir=path.join(manager.data,'logs');require('node:fs').mkdirSync(logDir,{recursive:true});const output=require('node:fs').createWriteStream(path.join(logDir,id+'-'+Date.now()+'.log'));output.on('error',()=>{});output.write(new Date().toISOString()+' Iniciando '+id+' '+(game?'jogo':'console')+'\n');child.stdout?.pipe(output,{end:false});child.stderr?.pipe(output,{end:false});child.once('close',code=>output.end('\n'+new Date().toISOString()+' Encerrado: '+code+'\n'));session=child;sessionBridge=bridge;sessionContent=game?.path||'';currentShortcuts=Shortcuts.normalize(c.controls?.shortcuts);sessionStateIdentity=identity;sessionInfo={id:require('node:crypto').randomUUID(),console:id,engine:plan.engine,mode:plan.setup?'setup':game?'game':'boot',discName:game?.name||null,bios:plan.bios,disc:!!manager.check(id).disc,saveStates:plan.saveStates??!manager.check(id).noStates,modern:!!plan.modern};quickMenu.attach(bridge);notifySession();

 const closed=new Promise((_,reject)=>{child.once('error',error=>reject(Error('Não foi possível iniciar o motor integrado: '+error.message)));child.once('close',code=>{bridge.closed=true;if(session===child){session=null;sessionInfo=null;sessionBridge=null;sessionContent='';quickMenu.detach();const caches=[...sessionCaches];sessionCaches.clear();for(const dir of caches)optical.cleanup(dir).catch(()=>{});notifySession();}const error=code!==0?manager.check(id).name+' encerrou com erro ('+(code==null?'sem código':'0x'+(code>>>0).toString(16).toUpperCase())+'). Consulte a aba Logs e filtre por '+id.toUpperCase()+'.':null;if(win&&!win.isDestroyed()){win.show();win.restore();win.focus();win.webContents.send('returned',{error});}reject(Error(error||'O console foi encerrado.'));});});

 try{await Promise.race([bridge.command('PING','',30000),closed]);if(session!==child)throw Error('O console foi encerrado.');if(plan.modern)child.enginePid=Number(await fs.readFile(path.join(plan.bridge,'child-pid.txt'),'utf8'));win.minimize();return {inserted:false,session:sessionInfo};}catch(e){if(session===child){child.kill();session=null;sessionInfo=null;sessionBridge=null;sessionContent='';quickMenu.detach();bridge.closed=true;notifySession();}throw e;}

}

async function stopCore(){if(!session)return;const child=session,bridge=sessionBridge;let timer;const closed=new Promise(resolve=>child.once('close',resolve));await bridge.command('QUIT','',10000);try{await Promise.race([closed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Feche a janela do console para continuar.')),10000);})]);}finally{clearTimeout(timer);}}

ipcMain.handle('launch',async(_,id,gameId)=>{manager.check(id);if(launching)throw Error('Aguarde a operação atual do console.');launching=true;try{await saveQueue;const c=await raw(),game=gameId?c.games.find(g=>g.id===gameId&&g.console===id):null;if(gameId&&!game)throw Error('Jogo não encontrado.');if(session){if(!manager.check(id).disc&&game)throw Error('Encerre o jogo atual antes de iniciar outro.');if(sessionInfo.console!==id)throw Error('Encerre o console aberto para iniciar outra plataforma.');if(game)return await insertDisc(id,game);await optical.focus(session.enginePid||session.pid);return {session:sessionInfo};}return await startCore(id,game,c);}finally{launching=false;}});

function shortcutBindings(value){return value.menuKeys.map(Shortcuts.keyVk).join(',')+';'+value.menuButtons.map(b=>Shortcuts.masks[b]).join(',');}

async function quickStateFile(){if(!sessionInfo)throw Error('O console foi encerrado.');if(!sessionInfo.saveStates)throw Error('Save state indisponível nesta integração. Use o salvamento do próprio jogo.');const key=crypto.createHash('sha256').update(sessionStateIdentity+'|'+(sessionContent||'boot').toLowerCase()).digest('hex').slice(0,32);return path.join(manager.data,'quick-states',sessionInfo.console,key,'slot-1.kstate');}

async function stopFromMenu(){if(launching)throw Error('Aguarde a operação atual.');launching=true;try{await stopCore();if(win&&!win.isDestroyed()){win.show();win.restore();win.focus();}return read();}finally{launching=false;}}

async function restartFromMenu(){if(launching||!sessionInfo)throw Error('Aguarde a operação atual.');launching=true;const id=sessionInfo.console,game=sessionContent?{path:sessionContent,name:sessionInfo.discName||path.basename(sessionContent)}:null;const caches=game?[...sessionCaches]:[];if(game)sessionCaches.clear();try{await stopCore();for(const dir of caches)sessionCaches.add(dir);await saveQueue;return await startCore(id,game,await raw());}catch(e){if(session)for(const dir of caches)sessionCaches.add(dir);else for(const dir of caches){sessionCaches.delete(dir);await optical.cleanup(dir).catch(()=>{});}throw e;}finally{launching=false;}}

ipcMain.handle('quick-theme',(_,theme)=>{if(['kaliw','neon','ocean','ember'].includes(theme))currentTheme=theme;});

ipcMain.handle('quick-open',()=>quickMenu.open());

ipcMain.handle('quick-state',()=>quickMenu.state());

ipcMain.handle('quick-action',(_,action)=>quickMenu.command(action));

ipcMain.handle('quick-input',()=>require('./input-devices.cjs').snapshot());

ipcMain.handle('session-focus',async()=>{if(session)await optical.focus(session.enginePid||session.pid);});

ipcMain.handle('session-stop',async()=>{if(launching)throw Error('Aguarde a operação atual do console.');launching=true;try{await stopCore();return read();}finally{launching=false;}});

ipcMain.handle('session-restart',async()=>{if(launching||!sessionInfo)throw Error('Aguarde ou inicie um console.');if(!manager.check(sessionInfo.console).boot)return restartFromMenu();launching=true;const id=sessionInfo.console;try{await stopCore();await saveQueue;return await startCore(id,null,await raw());}finally{launching=false;}});

ipcMain.handle('session-eject',async()=>{if(!session||launching)throw Error('Abra um console e aguarde a operação atual.');if(sessionInfo.console!=='ps1')throw Error('No PS2, escolha outro disco para trocar a mídia.');await sessionBridge.command('EJECT');sessionContent='';sessionInfo={...sessionInfo,discName:null};notifySession();});

ipcMain.handle('session-insert-file',async()=>{if(!sessionInfo||launching)throw Error('Abra o boot do console primeiro.');const id=sessionInfo.console;const result=await dialog.showOpenDialog(win,{title:'Inserir CD/DVD em '+id.toUpperCase(),properties:['openFile'],filters:[{name:'Imagem de CD/DVD',extensions:id==='ps1'?['cue','chd','bin','iso','img','pbp']:['iso','chd','cso','zso','gz','bin','cue']}]});if(result.canceled)return null;if(launching||!session||sessionInfo.console!==id)throw Error('O console foi encerrado ou está ocupado.');launching=true;try{const file=await discPath(result.filePaths[0]);let game;await update(c=>{game=c.games.find(g=>g.path===file&&g.console===id);if(!game){game={id:require('node:crypto').randomUUID(),console:id,path:file,name:path.basename(file,path.extname(file))};c.games.push(game);}});await insertDisc(id,game);return read();}finally{launching=false;}});

ipcMain.handle('optical-drives',()=>optical.drives());

ipcMain.handle('optical-cancel',()=>optical.cancel());

ipcMain.handle('optical-play',async(_,id,drive)=>{manager.check(id);if(launching)throw Error('Aguarde a operação atual do console.');if(sessionInfo&&sessionInfo.console!==id)throw Error('Encerre o console aberto para usar outra plataforma.');launching=true;const original=session;let image;try{await saveQueue;const c=await raw();if(!(await manager.status())[id].bios.length)throw Error('Importe a BIOS deste console antes de ler o disco.');image=await optical.read(drive);if(original&&session!==original)throw Error('O console foi encerrado durante a leitura.');sessionCaches.add(image.cache);if(session){await insertDisc(id,image);return {session:sessionInfo};}await saveQueue;return await startCore(id,image,await raw());}catch(e){if(image){sessionCaches.delete(image.cache);await optical.cleanup(image.cache).catch(()=>{});}throw e;}finally{launching=false;}});

ipcMain.handle('save-video',async(_,buffer)=>{const r=await dialog.showSaveDialog(win,{defaultPath:'Kaliw-boot.webm',filters:[{name:'Vídeo WebM',extensions:['webm']}]});if(r.canceled)return false;await fs.writeFile(r.filePath,Buffer.from(buffer));return true;});

ipcMain.handle('browse-files',(_,folder,id,kind)=>{const engine=manager.check(id);if(!['game','bios','insert','folder','support'].includes(kind))throw Error('Operação inválida.');return require('./file-browser.cjs').browse(folder,kind==='support'?(engine.supportExtensions||require('./optional-firmware.cjs').extensions(id)):kind==='bios'?manager.biosExtensions(id):kind==='folder'?[]:engine.extensions);});
ipcMain.handle('import-files',async(_,id,files,kind)=>{const engine=manager.check(id);if(!['game','bios','insert','support'].includes(kind))throw Error('Operação inválida.');const paths=await require('./file-browser.cjs').validateFiles(files,kind==='support'?(engine.supportExtensions||require('./optional-firmware.cjs').extensions(id)):kind==='bios'?manager.biosExtensions(id):engine.extensions);if(kind==='support'){if(session||launching)throw Error('Feche o motor atual para importar firmware.');if(id==='ps3'){if(paths.length!==1)throw Error('Selecione um arquivo PUP.');const head=await fs.open(paths[0],'r');try{const b=Buffer.alloc(8);await head.read(b,0,8,0);if(b.toString('ascii',0,4)!=='SCEU')throw Error('Arquivo PUP inválido.');}finally{await head.close();}launching=true;try{await startCore(id,null,await raw(),{firmware:paths[0]});return read();}finally{launching=false;}}if(engine.modern)await manager.modern.importSupport(id,paths);else await require('./optional-firmware.cjs').importOptional(manager.system,id,paths);return read();}if(kind==='bios'){if(session||launching)throw Error('Feche o jogo antes de importar BIOS.');await manager.importBios(id,paths);return read();}if(kind==='insert'&&(!sessionInfo||sessionInfo.console!==id||launching||!engine.disc))throw Error('Abra o console e aguarde antes de inserir um disco.');let game;if(kind==='game'){return addImportedGames(id,paths);}await update(c=>{for(const file of paths){game=c.games.find(g=>g.path===file&&g.console===id);if(!game){game={id:crypto.randomUUID(),console:id,path:file,name:path.basename(file,path.extname(file))};c.games.push(game);}}});if(kind==='insert'){launching=true;try{await insertDisc(id,game);}finally{launching=false;}}return read();});
ipcMain.handle('scan-folder',async(_,folder)=>online.scan(require('./file-browser.cjs').localPath(folder)));

ipcMain.handle('modern-configure',async(_,id)=>{if(!manager.check(id).modern)throw Error('Motor inválido.');if(session||launching)throw Error('Encerre o motor atual antes de configurar outro.');launching=true;try{return await startCore(id,null,await raw(),{configure:true});}finally{launching=false;}});
ipcMain.handle('remove-optional',async(_,id,file)=>{if(session||launching)throw Error('Feche o jogo antes de apagar firmware.');await require('./optional-firmware.cjs').removeOptional(manager.system,id,file);return read();});
ipcMain.handle('firmware-guide',(_,id)=>{const urls={ps3:'https://www.playstation.com/en-us/support/hardware/ps3/system-software/',ps4:'https://www.shadps4.net/quickstart/',switch:'https://eden-emu.dev/getting-started/',x360:'https://github.com/xenia-canary/xenia-canary/wiki/Quickstart'};if(!urls[id])throw Error('Guia indisponível.');return shell.openExternal(urls[id]);});

ipcMain.handle('compatibility',(_,query)=>require('./compatibility-manager.cjs').list(app.isPackaged?process.resourcesPath:__dirname,query));
ipcMain.handle('compatibility-source',async(_,id)=>shell.openExternal(await require('./compatibility-manager.cjs').source(app.isPackaged?process.resourcesPath:__dirname,id)));

let modsInstance;const modsManager=()=>modsInstance||(modsInstance=new (require('./mods-manager.cjs').Mods)(manager.data));
ipcMain.handle('mods-list',()=>modsManager().list());
ipcMain.handle('mods-community',()=>shell.openExternal('https://www.romhacking.net/'));
ipcMain.handle('mods-import',async(_,id)=>{const game=(await raw()).games.find(g=>g.id===id);if(!game)throw Error('Selecione um jogo da biblioteca.');const result=await dialog.showOpenDialog(win,{title:'Importar patch para '+game.name,properties:['openFile'],filters:[{name:'Patches da comunidade',extensions:['ips','bps','ups','xdelta','ppf']}]});if(result.canceled)return null;return modsManager().import(result.filePaths[0],game);});
ipcMain.handle('mods-remove',(_,id)=>modsManager().remove(id));
ipcMain.handle('mods-apply',async(_,id)=>{const row=(await modsManager().list()).find(r=>r.id===id),game=(await raw()).games.find(g=>g.id===row?.gameId);if(!game)throw Error('Jogo original indisponível.');const copy=await modsManager().apply(id,game);return update(c=>{if(!c.games.some(g=>g.path===copy.path))c.games.push({id:crypto.randomUUID(),console:game.console,path:copy.path,name:copy.name,modId:id,baseSHA256:copy.baseSHA256});});});

ipcMain.handle('logs',(_,query)=>require('./logs-manager.cjs').logs(manager.data,query));

app.on('will-quit',()=>require('./input-devices.cjs').dispose());

async function selectQuickGame(gameId){if(launching||!sessionInfo)throw Error('Aguarde a operação atual do console.');launching=true;const id=sessionInfo.console;try{await saveQueue;const c=await raw(),game=c.games.find(g=>g.id===gameId&&g.console===id);if(!game)throw Error('Jogo indisponível nesta plataforma.');await fs.access(game.path).catch(()=>{throw Error('O arquivo foi movido ou removido. Importe novamente na biblioteca.');});if(manager.check(id).disc)return await insertDisc(id,game);await stopCore();return await startCore(id,game,c);}finally{launching=false;}}
ipcMain.handle('quick-library',()=>quickMenu.games());
ipcMain.handle('quick-game',(_,id)=>quickMenu.selectGame(id));
