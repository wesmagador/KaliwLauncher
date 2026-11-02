const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
let win, running = false;
const defaults = () => ({ emulators: {ps1:'',ps2:''}, games: [], fullboot:true });
const configPath = () => path.join(app.getPath('userData'), 'library.json');
async function read() { try { return {...defaults(), ...JSON.parse(await fs.readFile(configPath(),'utf8'))}; } catch(e) { if(e.code==='ENOENT') return defaults(); throw e; } }
async function save(config) { const p=configPath(); await fs.writeFile(p+'.tmp',JSON.stringify(config,null,2)); await fs.rename(p+'.tmp',p); return config; }
app.whenReady().then(() => {
 win = new BrowserWindow({width:1440,height:900,minWidth:1000,minHeight:680,backgroundColor:'#0a0c10',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',e=>e.preventDefault());
 win.loadFile('index.html');
});
app.on('window-all-closed',()=>app.quit());
ipcMain.handle('read',read);
ipcMain.handle('emulator',async(_,consoleId)=>{if(!['ps1','ps2'].includes(consoleId))throw Error('Console inválido'); const r=await dialog.showOpenDialog(win,{title:'Selecionar emulador',filters:[{name:'Executável',extensions:['exe']}],properties:['openFile']});if(r.canceled)return null;const c=await read();c.emulators[consoleId]=r.filePaths[0];return save(c);});
ipcMain.handle('import',async(_,consoleId)=>{if(!['ps1','ps2'].includes(consoleId))throw Error('Console inválido');const r=await dialog.showOpenDialog(win,{title:'Adicionar jogos de '+consoleId.toUpperCase(),filters:[{name:'Imagens de disco',extensions:consoleId==='ps1'?['cue','chd','pbp','iso','m3u']:['iso','chd','cso','gz']}],properties:['openFile','multiSelections']});if(r.canceled)return null;const c=await read();for(const file of r.filePaths)if(!c.games.some(g=>g.path===file&&g.console===consoleId))c.games.push({id:require('node:crypto').randomUUID(),console:consoleId,path:file,name:path.basename(file,path.extname(file))});return save(c);});
ipcMain.handle('remove',async(_,id)=>{const c=await read();c.games=c.games.filter(g=>g.id!==id);return save(c);});
ipcMain.handle('boot-mode',async(_,enabled)=>{const c=await read();c.fullboot=!!enabled;return save(c);});
ipcMain.handle('launch',async(_,consoleId,gameId)=>{
 if(running)throw Error('Um emulador já está aberto. Feche-o para voltar a jogar.');
 if(!['ps1','ps2'].includes(consoleId))throw Error('Console inválido');
 const c=await read(),exe=c.emulators[consoleId];if(!exe)throw Error('Configure o emulador em Ajustes primeiro.');await fs.access(exe);
 const game=gameId?c.games.find(g=>g.id===gameId&&g.console===consoleId):null;if(gameId&&!game)throw Error('Jogo não encontrado');if(game)await fs.access(game.path);
 const args=['-fullscreen','-batch'];if(game){args.push(c.fullboot?'-slowboot':'-fastboot','--',game.path);}else args.push('-bios');
 await new Promise((resolve,reject)=>{const child=spawn(exe,args,{cwd:path.dirname(exe),shell:false});child.once('error',reject);child.once('spawn',()=>{running=true;win.minimize();resolve();});child.once('exit',()=>{running=false;if(!win.isDestroyed()){win.restore();win.focus();win.webContents.send('returned');}});});return true;
});
ipcMain.handle('save-video',async(_,buffer)=>{const r=await dialog.showSaveDialog(win,{defaultPath:'Kaliw-boot.webm',filters:[{name:'Vídeo WebM',extensions:['webm']}]});if(r.canceled)return false;await fs.writeFile(r.filePath,Buffer.from(buffer));return true;});
