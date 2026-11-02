const navigationTabs=['home','biosNav','libraryNav','compatibilityNav','logsNav','modsNav','settingsNav'];let navigationPolling=false,navigationArmed=false,navigationLast=0;

function syncNavigation(){const shortcuts=Shortcuts.normalize(config.controls?.shortcuts);$('navPadLeft').textContent=Shortcuts.padLabel(shortcuts.navButtons[0]);$('navPadRight').textContent=Shortcuts.padLabel(shortcuts.navButtons[1]);$('navKeyLeft').textContent=Shortcuts.keyLabel(shortcuts.navKeys[0]);$('navKeyRight').textContent=Shortcuts.keyLabel(shortcuts.navKeys[1]);$('navPrev').title='Anterior: '+Shortcuts.padLabel(shortcuts.navButtons[0])+' ou '+Shortcuts.keyLabel(shortcuts.navKeys[0]);$('navNext').title='Próximo: '+Shortcuts.padLabel(shortcuts.navButtons[1])+' ou '+Shortcuts.keyLabel(shortcuts.navKeys[1]);const active=typeof logsView!=='undefined'&&logsView?'logsNav':typeof modsView!=='undefined'&&modsView?'modsNav':typeof compatibilityView!=='undefined'&&compatibilityView?'compatibilityNav':settingsView?'settingsNav':hubView==='bios'?'biosNav':hubView==='games'||view==='games'?'libraryNav':'home';for(const id of navigationTabs){$(id).classList.toggle('active',id===active);if(id===active)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');}const button=$(active);$('navMarker').style.width=button.offsetWidth+'px';$('navMarker').style.transform=`translateX(${button.offsetLeft}px)`;}

function canNavigateTabs(){if(typeof controlCapture!=='undefined'&&controlCapture)return false;const dialog=document.querySelector('dialog[open]');return $('boot').style.display==='none'&&!dialog;}

function navigateTab(delta){if(!canNavigateTabs())return;const current=typeof compatibilityView!=='undefined'&&compatibilityView?'compatibilityNav':settingsView?'settingsNav':navigationTabs.find(id=>$(id).classList.contains('active'))||'home';const buttons=navigationTabs.filter(id=>!$(id).disabled),index=buttons.indexOf(current);const next=buttons[(index+delta+buttons.length)%buttons.length];settingsView=false;$(next).click();window.scrollTo({top:0,behavior:'instant'});syncNavigation();}

$('navPrev').onclick=()=>navigateTab(-1);$('navNext').onclick=()=>navigateTab(1);window.syncNavigation=syncNavigation;

for(const id of navigationTabs)$(id).addEventListener('click',()=>queueMicrotask(syncNavigation));new MutationObserver(syncNavigation).observe($('settings'),{attributes:true,attributeFilter:['open']});window.addEventListener('resize',syncNavigation);

document.addEventListener('keydown',event=>{if(event.defaultPrevented||event.repeat||!canNavigateTabs()||event.target.closest?.('input,select,textarea,[contenteditable="true"]'))return;const token=keyboardToken(event.code),keys=Shortcuts.normalize(config.controls?.shortcuts).navKeys;const delta=token===keys[0]?-1:token===keys[1]?1:0;if(delta){event.preventDefault();event.stopImmediatePropagation();navigateTab(delta);}},true);

async function pollNavigationPad(){if(!api||navigationPolling||!document.hasFocus()||!canNavigateTabs()){navigationArmed=false;return;}navigationPolling=true;try{const devices=await api.inputSnapshot();const pair=Shortcuts.normalize(config.controls?.shortcuts).navButtons;const left=devices.some(d=>Shortcuts.down(d,pair[0])),right=devices.some(d=>Shortcuts.down(d,pair[1]));if(!left&&!right){navigationArmed=true;return;}if(!navigationArmed||left&&right||Date.now()-navigationLast<230)return;navigationArmed=false;navigationLast=Date.now();navigateTab(left?-1:1);}finally{navigationPolling=false;}}

setInterval(()=>pollNavigationPad().catch(()=>{}),70);syncNavigation();

