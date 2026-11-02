const $=id=>document.getElementById(id);

const api=window.kaliw;

$('settings').querySelector('.dialog-head').after($('appearanceTemplate').content.cloneNode(true));

const appearanceDefaults={theme:'kaliw',style:'coverflow',motion:'vivid'};

let appearance={...appearanceDefaults};

try{appearance={...appearanceDefaults,...JSON.parse(localStorage.getItem('kaliw-appearance')||'{}')};}catch{}

if(matchMedia('(prefers-reduced-motion: reduce)').matches)appearance.motion='off';

function applyAppearance(){api?.quickTheme?.(appearance.theme);for(const key of Object.keys(appearanceDefaults))document.body.dataset[key]=appearance[key];document.querySelectorAll('[data-preference]').forEach(button=>{const active=appearance[button.dataset.preference]===button.dataset.value;button.classList.toggle('chosen',active);button.setAttribute('aria-pressed',String(active));});}

function setAppearance(key,value){appearance[key]=value;try{localStorage.setItem('kaliw-appearance',JSON.stringify(appearance));}catch{}applyAppearance();render();}

let hubView=null,settingsView=false;

let config={emulators:{ps1:'',ps2:''},engines:{},games:[],fullboot:true},consoleId='ps2',view='consoles',index=0,items=[],toastTimer;

const consoles=KaliwPlatforms.platforms;



function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',5500);}

async function action(fn){try{await fn();}catch(e){toast(e.message||String(e));}}

function selected(){return items[index];}

function render(){

 $('settings').hidden=!settingsView;document.querySelector('.heading').hidden=settingsView;document.querySelector('main > .eyebrow').hidden=settingsView;

 if(settingsView){$('onlineHub').hidden=true;for(const id of ['shelfHeading','carousel'])$(id).hidden=true;document.querySelector('.selection').hidden=true;window.syncNavigation?.();return;}

 window.syncNavigation?.();window.renderSession?.();

 if(hubView&&window.renderHub){window.renderHub();return;}

 $('onlineHub').hidden=true;for(const id of ['shelfHeading','carousel'])$(id).hidden=false;document.querySelector('.selection').hidden=false;$('biosNav').classList.remove('active');document.querySelector('h1').innerHTML='O próximo nível<br>começa <em>aqui.</em>';

 items=view==='consoles'?consoles.filter(c=>config.emulators[c.id]):config.games.filter(g=>g.console===consoleId);

 if(!items.length)items=[view==='consoles'?{id:'setup',name:'Seu primeiro console',symbol:'+',setup:true,description:'Os motores integrados não estão disponíveis neste pacote.'}:{id:'empty',name:'Sua próxima aventura',console:consoleId,symbol:'+',empty:true}];

 index=Math.max(0,index);

 index=Math.min(index,items.length-1);const current=selected();

 $('total').textContent=String(config.games.length).padStart(2,'0');$('sectionLabel').textContent=view==='consoles'?'01 / ESCOLHA SEU UNIVERSO':`02 / BIBLIOTECA ${consoleId.toUpperCase()} · ${config.games.filter(g=>g.console===consoleId).length} JOGOS`;

 const previous=new Map([...$('carousel').children].map(card=>[card.dataset.key,card]));

 const shelf=items.map((item,i)=>({item,offset:i-index})).filter(x=>Math.abs(x.offset)<=3);

 const activeKeys=new Set();

 for(const {item,offset} of shelf){const key=`${view}:${item.id}`;activeKeys.add(key);const card=previous.get(key)||document.createElement('button');const fresh=!previous.has(key);card.dataset.key=key;card.className=`card ${item.console||''} ${offset===0?'selected':''} ${item.empty||item.setup?'placeholder':''}`;const gallery=appearance.style==='gallery';card.style.transform=gallery?`translateX(${offset*275}px) scale(${offset===0?1:.88})`:`translateX(${offset*265}px) translateZ(${-Math.abs(offset)*110}px) rotateY(${offset===0?0:offset<0?28:-28}deg)`;card.style.opacity=String(Math.max(.15,1-Math.abs(offset)*.18));card.style.zIndex=String(10-Math.abs(offset));card.setAttribute('aria-label',item.name);card.setAttribute('aria-current',String(offset===0));

 const label=document.createElement('small');label.textContent=item.setup?'PRONTO PARA UM NOVO MUNDO':view==='consoles'?'KALIW / CONSOLE COLLECTION':item.empty?'SUA BIBLIOTECA COMEÇA AQUI':`${item.console.toUpperCase()} / IMAGEM LOCAL`;

 const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent=item.symbol||item.name.slice(0,2).toUpperCase();

 const orb=document.createElement('div');orb.className='orb';const bottom=document.createElement('div');bottom.className='card-bottom';const text=document.createElement('div');const name=document.createElement('strong');name.textContent=item.name;const count=document.createElement('span');count.className='count';count.textContent=item.setup?'CONFIGURAR EMULADORES ↗':view==='consoles'?`${config.games.filter(g=>g.console===item.id).length} JOGOS NA BIBLIOTECA`:item.empty?'ADICIONE SEUS JOGOS':'PRONTO PARA INICIAR';text.append(name,count);const year=document.createElement('span');year.className='year';year.textContent=item.year||'↗';bottom.append(text,year);card.replaceChildren(label,symbol,orb,bottom);card.onclick=()=>{if(offset===0)enter();else move(offset);};if(fresh){$('carousel').append(card);if(appearance.motion!=='off')card.animate([{opacity:0,translate:'0 25px'},{opacity:Number(card.style.opacity),translate:'0 0'}],{duration:550,easing:'cubic-bezier(.2,.8,.2,1)'});}}

 for(const [key,card] of previous)if(!activeKeys.has(key))card.remove();

 $('selectedTitle').textContent=current.name;$('selectedTag').textContent=view==='consoles'?(current.vendor||'Kaliw')+' / '+(current.engine||'MOTOR INTEGRADO'):(consoles.find(c=>c.id===consoleId)?.name||consoleId)+' / MOTOR INTEGRADO';$('selectedDescription').textContent=view==='consoles'?current.description:current.empty?'Importe imagens de disco para começar a jogar.':current.path;

 $('enter').textContent=current.setup?'Configurar console →':view==='consoles'?(current.boot?'Iniciar console →':'Abrir biblioteca →'):current.empty?'Adicionar jogos +':'Jogar agora →';$('bios').hidden=!!current.setup||view==='consoles';$('bios').textContent=view==='consoles'?'Boot do console ↗':'Adicionar jogos +';$('home').classList.toggle('active',view==='consoles');$('libraryNav').classList.toggle('active',view==='games');$('prev').disabled=$('next').disabled=items.length<2;$('libraryNav').disabled=!consoles.some(c=>config.emulators[c.id]);

 $('subtitle').textContent=current.setup?'Seu universo começa com a conexão de um emulador.':'Escolha seu console. Reviva o que te fez jogar.';

 if(appearance.motion!=='off')$('selectedTitle').animate([{opacity:0,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:300});

}

function move(delta){index=(index+delta+items.length)%items.length;render();}

function enter(){if(selected().setup)return settings();if(view==='consoles'){consoleId=selected().id;if(!selected().boot){const name=selected().name;hubMode='library';openHub('games');hubFilter=consoleId;renderHub();if(!config.games.some(g=>g.console===consoleId))toast('Importe seus jogos de '+name+' para começar.');}else action(()=>launchSession(consoleId));}else if(selected().empty)importGames();else action(async()=>{if(!api)return toast('Abra pelo aplicativo para iniciar emuladores.');await launchSession(consoleId,selected().id);});}

async function importGames(){await action(async()=>{if(!api)return toast('A importação está disponível no aplicativo Windows.');const c=await openFileBrowser(consoleId,'game');if(c){config=c;render();}});}

function refreshEngines(){}

function settings(){settingsView=true;hubView=null;$('fullboot').checked=config.fullboot;window.openControlSettings?.();render();window.scrollTo({top:0,behavior:'smooth'});}

let startingSession=false;

async function launchSession(id,game){if(startingSession)return;if(config.engines?.[id]?.requiresBios!==false&&!config.engines?.[id]?.bios.length){openHub('bios');return toast('Importe sua BIOS de '+id.toUpperCase()+' para continuar.');}startingSession=true;$('enter').disabled=true;$('enter').textContent='Iniciando jogo…';try{const result=await api.launch(id,game);if(result?.session)config.session=result.session;window.renderSession?.();if(result?.inserted)toast('CD/DVD inserido no console em execução.');}finally{startingSession=false;$('enter').disabled=false;render();}}

function home(){if(typeof cancelCapture==='function')cancelCapture();window.scrollTo({top:0,behavior:'instant'});settingsView=false;hubView=null;view='consoles';index=Math.max(0,consoles.filter(c=>config.emulators[c.id]).findIndex(c=>c.id===consoleId));render();}

$('home').onclick=home;$('libraryNav').onclick=()=>{if(!config.emulators[consoleId])consoleId=consoles.find(c=>config.emulators[c.id])?.id||'ps2';view='games';index=0;render();};$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('enter').onclick=enter;$('settingsNav').onclick=settings;$('closeSettings').onclick=()=>home();$('bios').onclick=()=>view==='games'||!selected().boot?importGames():action(async()=>{if(!api)return toast('Abra pelo aplicativo para iniciar o boot.');await launchSession(selected().id);});

document.querySelectorAll('[data-bios]').forEach(button=>button.onclick=()=>action(async()=>{if(!api)return;button.disabled=true;try{const c=await api.bios(button.dataset.bios);if(c){config=c;refreshEngines();render();toast('BIOS importada para o Kaliw.');}}finally{button.disabled=false;}}));

$('dataFolder').onclick=()=>action(()=>api?.dataFolder());

$('licenses').onclick=()=>action(()=>api?.licenses());

document.querySelectorAll('[data-preference]').forEach(button=>button.onclick=()=>setAppearance(button.dataset.preference,button.dataset.value));

document.addEventListener('pointerdown',event=>{const button=event.target.closest('button');if(!button||button.disabled||appearance.motion==='off')return;const rect=button.getBoundingClientRect(),ripple=document.createElement('span');ripple.className='ripple';ripple.style.left=`${event.clientX-rect.left}px`;ripple.style.top=`${event.clientY-rect.top}px`;button.append(ripple);ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});});

applyAppearance();

$('fullboot').onchange=()=>action(async()=>{if(api)config=await api.bootMode($('fullboot').checked);});

document.addEventListener('keydown',e=>{if($('boot').style.display!=='none'){if(e.key==='Enter'||e.key==='Escape')skip();return;}if(document.querySelector('dialog[open]'))return;if(settingsView)return;if(e.target.closest?.('button,input,select,textarea'))return;if(hubView){if(e.key==='Escape'&&!['INPUT','SELECT'].includes(e.target.tagName))home();return;}if(['ArrowLeft','ArrowRight','Enter','Escape','Delete'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='Enter')enter();if(e.key==='Escape')home();if(e.key==='Delete'&&view==='games'&&!selected().empty)action(async()=>{if(api&&await askConfirm(`Remover ${selected().name} da biblioteca? O arquivo será preservado.`)){config=await api.remove(selected().id);render();}});});

function clock(){$('clock').textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}clock();setInterval(clock,10000);

let bootFrame,bootStart;const canvas=$('bootCanvas'),ctx=canvas.getContext('2d');

function drawBoot(seconds,target=ctx){const w=1280,h=720;target.fillStyle='#07090d';target.fillRect(0,0,w,h);const glow=target.createRadialGradient(640,350,10,640,350,500);glow.addColorStop(0,'#263c28');glow.addColorStop(.5,'#17182d');glow.addColorStop(1,'#07090d');target.fillStyle=glow;target.fillRect(0,0,w,h);for(let i=0;i<90;i++){const x=(i*179.3+seconds*(10+i%7))%w,y=(i*81.7)%h;target.fillStyle=`rgba(197,250,102,${.1+(i%4)*.08})`;target.fillRect(x,y,i%3+1,i%3+1);}target.save();target.translate(640,322);target.strokeStyle='#c5fa6644';target.lineWidth=1;for(let i=0;i<3;i++){target.beginPath();target.ellipse(0,0,150+i*38,70+i*22,seconds*.2+i*.7,0,Math.PI*2);target.stroke();}target.globalAlpha=Math.min(1,seconds/1.4);target.fillStyle='#c5fa66';target.font='italic 900 130px Segoe UI';target.textAlign='center';target.shadowColor='#c5fa66';target.shadowBlur=28;target.fillText('K',-6,40);target.shadowBlur=0;target.fillStyle='#f2f5f0';target.font='600 36px Segoe UI';target.fillText('K A L I W',0,177);target.fillStyle='#8d9797';target.font='11px Segoe UI';target.fillText('S E U   P R Ó X I M O   U N I V E R S O',0,213);target.restore();target.fillStyle='#c5fa66';target.fillRect(490,630,Math.min(seconds/6,1)*300,2);}

function animate(t){bootStart??=t;const seconds=(t-bootStart)/1000;drawBoot(seconds);if(seconds<6)bootFrame=requestAnimationFrame(animate);else skip();}

function skip(){cancelAnimationFrame(bootFrame);$('bootVideo').pause();$('boot').style.display='none';}

function replay(){bootStart=undefined;$('boot').style.display='flex';const video=$('bootVideo');video.style.display='block';video.currentTime=0;video.onended=skip;video.play().catch(()=>{video.style.display='none';bootFrame=requestAnimationFrame(animate);});}

$('skip').onclick=skip;$('replay').onclick=()=>{home();replay();};

$('exportVideo').onclick=()=>action(async()=>{if(!api)return toast('Exporte pelo aplicativo Windows.');const button=$('exportVideo');button.disabled=true;$('exportStatus').textContent='Renderizando abertura em vídeo…';try{const output=document.createElement('canvas');output.width=1280;output.height=720;const stream=output.captureStream(30),chunks=[];const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});const done=new Promise(resolve=>recorder.onstop=resolve);recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();const start=performance.now();await new Promise(resolve=>{function frame(t){drawBoot((t-start)/1000,output.getContext('2d'));if(t-start<6000)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const saved=await api.saveVideo(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());$('exportStatus').textContent=saved?'Vídeo salvo.':'Exportação cancelada.';}finally{button.disabled=false;}});

if(api){action(async()=>{config=await api.read();render();});api.onReturned(result=>toast(result?.error||'Bem-vindo de volta ao Kaliw.')); }render();if(matchMedia('(prefers-reduced-motion: reduce)').matches)skip();else replay();

