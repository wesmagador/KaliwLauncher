const {app,BrowserWindow}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(__dirname,'.build-runtime','smoke-profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
 const errors=[];win.webContents.on('console-message',(_,details)=>{if(details.level==='error')errors.push(details.message);});
 try{
 await win.loadFile('index.html');
 console.log(await win.webContents.executeJavaScript(`(()=>{
 skip();
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
 assert(document.querySelectorAll('.card').length===1&&selected().setup,'Setup state');
 enter();assert($('settings').open,'Setup opens settings');$('settings').close();
 config.emulators.ps1='integrated';config.engines={ps1:{name:'SwanStation',available:true,bios:[]},ps2:{name:'ParaLLEl PS2',available:true,bios:[]}};home();
 assert(items.length===1&&selected().id==='ps1','Only configured emulator');
 config.emulators.ps2='integrated';home();
 assert(document.querySelectorAll('.card').length===2,'Two unique console covers');
 const first=$('carousel').querySelector('[data-key="consoles:ps2"]');
 move(1);assert(first===$('carousel').querySelector('[data-key="consoles:ps2"]'),'Card retained for transitions');
 move(-1);enter();assert(selected().empty,'Empty game library');
 home();settings();
 document.querySelector('[data-preference="theme"][data-value="neon"]').click();
 assert(document.body.dataset.theme==='neon','Live theme');
 document.querySelector('[data-preference="style"][data-value="gallery"]').click();
 assert(document.body.dataset.style==='gallery','Gallery layout');
 document.querySelector('[data-preference="motion"][data-value="off"]').click();
 assert(document.body.dataset.motion==='off','Motion toggle');
 assert(JSON.parse(localStorage.getItem('kaliw-appearance')).theme==='neon','Saved theme');
 $('settings').close();return 'Configured console filtering, no duplicates, stable card navigation, themes, layouts and motion passed';
 })()`));
 await new Promise(resolve=>{win.webContents.once('did-finish-load',resolve);win.webContents.reload();});
 console.log(await win.webContents.executeJavaScript(`(()=>{skip();if(document.body.dataset.theme!=='neon'||document.body.dataset.style!=='gallery'||document.body.dataset.motion!=='off')throw Error('Preferences lost on reload');config.emulators={ps1:'integrated',ps2:'integrated'};config.engines={ps1:{name:'SwanStation',available:true,bios:[]},ps2:{name:'ParaLLEl PS2',available:true,bios:[]}};setAppearance('theme','kaliw');setAppearance('style','coverflow');setAppearance('motion','vivid');home();return 'Preferences restored after reload';})()`));
 await fs.mkdir(path.join(__dirname,'artifacts'),{recursive:true});
 await new Promise(resolve=>setTimeout(resolve,900));
 await fs.writeFile(path.join(__dirname,'artifacts','KaliwLauncher-0.2.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript('settings()');
 await new Promise(resolve=>setTimeout(resolve,450));
 await fs.writeFile(path.join(__dirname,'artifacts','KaliwLauncher-appearance.png'),(await win.webContents.capturePage()).toPNG());
 if(errors.length)throw Error(errors.join('\n'));await fs.writeFile(path.join(__dirname,'artifacts','smoke-result.json'),JSON.stringify({passed:true,checks:['configured-consoles','unique-covers','retained-cards','themes','layouts','motion','persisted-preferences']}));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
