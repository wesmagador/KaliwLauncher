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
 move(-1);assert($('home').textContent==='Consoles','Consoles label');assert($('enter').textContent==='Iniciar console →','Consoles starts boot');assert($('bios').hidden,'Duplicate boot button hidden');
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
 console.log(await win.webContents.executeJavaScript(`(()=>{const assert=(ok,msg)=>{if(!ok)throw Error(msg)};catalog=${JSON.stringify(require('./catalog.cjs'))};catalogLoaded=true;config.games=[{id:'owned',name:'Local PS1',console:'ps1',path:'fixture'},{id:'unsupported',name:'Hidden PS3',console:'ps3',path:'fixture'}];openHub('bios');assert($('onlineHub').hidden===false&&$('carousel').hidden,'BIOS tab hides shelf');assert(document.querySelectorAll('.bios-status').length===2,'BIOS status');assert(document.querySelectorAll('.catalog-card').length===1,'Only PS1 open firmware');reviewDownload('ps1-openbios');assert($('downloadReview').open,'Download requires confirmation');$('downloadReview').close();openHub('games');assert(document.querySelectorAll('.catalog-card').length===2,'Only supported games');$('catalogPlatform').value='ps2';$('catalogPlatform').dispatchEvent(new Event('change'));assert(document.querySelectorAll('.catalog-card').length===1&&$('catalogList').textContent.includes('NIM'),'Platform filter');hubFilter='all';hubMode='library';renderHub();assert(document.querySelectorAll('.catalog-card').length===1&&!$('catalogList').textContent.includes('Hidden PS3'),'Unsupported library game hidden');hubMode='discover';openHub('games');return 'BIOS and Games tabs, download confirmation, platform filters and supported library passed';})()`));
 console.log(await win.webContents.executeJavaScript(`(()=>{const assert=(x,m)=>{if(!x)throw Error(m)};const before=$('catalogList').firstElementChild;const id=before.dataset.entryId;for(let n=0;n<=100;n++){transfers.set(id,{state:'downloading',percent:n,received:n*100});updateTransfer(id);assert($('catalogList').firstElementChild===before,'Download rebuilt card');}assert(before.querySelector('progress').value===100,'Progress updated');assert(!$('settings').querySelector('[data-bios]'),'Duplicate BIOS settings removed');config.engines.ps1.bios=['openbios.bin','ps1-other.bin'];openHub('bios');assert(document.querySelector('select[aria-label="BIOS para PlayStation"]').options.length===3,'Multiple BIOS selector');assert(document.querySelectorAll('.bios-delete').length===2,'Each BIOS can be removed');const originalConfirm=window.confirm;window.confirm=()=>false;document.querySelector('.bios-delete').click();window.confirm=originalConfirm;assert(config.engines.ps1.bios.length===2,'Cancel preserves BIOS');settings();$('configureControls').click();assert($('controlsDialog').open,'Controls dialog opens');assert($('playerTabs').children.length===4,'Four players');beginCapture('b','key');document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV',bubbles:true}));assert(controlDraft.players[0].keys.b==='v','Keyboard mapping captured');$('controlsDialog').close();$('settings').close();return 'Stable progress cards, BIOS selector, settings cleanup, four player UI and keyboard capture passed';})()`));
 await new Promise(resolve=>setTimeout(resolve,450));
 await fs.writeFile(path.join(__dirname,'artifacts','KaliwLauncher-downloads.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript(`settings();$('configureControls').click();`);await new Promise(r=>setTimeout(r,300));await fs.writeFile(path.join(__dirname,'artifacts','KaliwLauncher-controls.png'),(await win.webContents.capturePage()).toPNG());await win.webContents.executeJavaScript(`$('controlsDialog').close();$('settings').close();openHub('bios');`);await new Promise(r=>setTimeout(r,300));await fs.writeFile(path.join(__dirname,'artifacts','KaliwLauncher-bios.png'),(await win.webContents.capturePage()).toPNG());
 await win.webContents.executeJavaScript(`config.session={console:'ps1',mode:'boot',bios:'openbios.bin'};home();renderSession();`);await new Promise(r=>setTimeout(r,300));await fs.writeFile(path.join(__dirname,'artifacts','KaliwLauncher-session.png'),(await win.webContents.capturePage()).toPNG());
 if(errors.length)throw Error(errors.join('\n'));await fs.writeFile(path.join(__dirname,'artifacts','smoke-result.json'),JSON.stringify({passed:true,checks:['configured-consoles','unique-covers','retained-cards','themes','layouts','motion','persisted-preferences']}));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
