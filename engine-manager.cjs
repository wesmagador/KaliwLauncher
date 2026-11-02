const fs = require('node:fs/promises');

const path = require('node:path');

const crypto = require('node:crypto');

const {platforms}=require('./platforms.js');

const engines=Object.fromEntries(platforms.map(p=>[p.id,{...p,name:p.engine}]));

const quote = value => '"'+String(value).replaceAll('\\','/').replaceAll('"','')+'"';

const line = (key,value) => `${key} = ${quote(value)}`;

class EngineManager {

 constructor(bundle,data,layout=null){this.bundle=bundle;this.data=data;this.layout=layout;this.system=path.join(data,'system');this.arcade=new (require('./arcade-manager.cjs').ArcadeManager)(bundle,data);this.modern=new (require('./modern-manager.cjs').ModernManager)(bundle,data,layout);}

 systemFor(id){return this.layout&&id!=='ps2'?this.layout.bios(id):this.system;}
 biosDirectory(id){return this.layout?this.layout.bios(id):id==='ps1'?this.system:path.join(this.system,'pcsx2','bios');}
 check(id){if(!engines[id])throw Error('Console inválido');return engines[id];}

 biosExtensions(id){return id==='ps2'?['bin','rom0','rom','bios']:['bin'];}

 isOpenBios(data){return crypto.createHash('sha256').update(data).digest('hex')==='0a9685d9895b422f091a9bcceed8f73cf67a414c09eb8310c714f27ccdfdb349';}

 isBios(id,data){return id==='ps1'?data.length===524288&&(data.includes(Buffer.from('Sony Computer Entertainment'))||this.isOpenBios(data)):id==='ps2'&&data.length===4194304&&data.includes(Buffer.from('ROMDIR'))&&data.includes(Buffer.from('RESET'));}

 async status(){const result={};for(const [id,engine] of Object.entries(engines)){if(engine.modern){result[id]=await this.modern.status(id);continue;}let available=true;for(const f of ['retroarch.exe',path.join('cores',engine.file)]){try{await fs.access(path.join(this.bundle,f));}catch{available=false;}}

 const dir=this.biosDirectory(id);let bios=[];if(engine.bios)try{bios=(await fs.readdir(dir)).filter(f=>/\.bin$/i.test(f));}catch{}

 let biosLabels={};try{biosLabels=JSON.parse(await fs.readFile(path.join(dir,'bios-labels.json'),'utf8'));}catch{}

 result[id]={name:engine.name,available,bios,biosLabels,optionalFirmware:await require('./optional-firmware.cjs').files(this.systemFor(id),id),optionalFirmwareInfo:await require('./optional-firmware.cjs').info(this.systemFor(id),id),requiresBios:!!engine.bios,boot:!!engine.boot,disc:!!engine.disc,saveStates:!engine.noStates};}return result;}

 async importBios(id,files){if(!this.check(id).bios)throw Error('Esta plataforma não usa importação de BIOS.');const dir=this.biosDirectory(id);await fs.mkdir(dir,{recursive:true});let count=0;

 // Validate all selected images before changing the managed firmware directory.

 const images=[];for(const file of files){if(!this.biosExtensions(id).includes(path.extname(file).slice(1).toLowerCase()))throw Error(id==='ps2'?'Selecione a BIOS principal .ROM0, .bin, .rom ou .bios. ROM1, DIFF, NVM e MEC são arquivos auxiliares.':'Importe uma BIOS descompactada no formato .bin.');const stat=await fs.stat(file);if(!stat.isFile()||stat.size>(id==='ps2'?4194304:524288))throw Error('Tamanho de BIOS inválido.');const data=await fs.readFile(file);

 if(!this.isBios(id,data))throw Error(id==='ps1'?'Importe uma BIOS de PS1 de 512 KB ou o OpenBIOS verificado.':'A BIOS de PS2 precisa ser uma imagem válida de 4 MB.');

 const name=id==='ps1'&&this.isOpenBios(data)?'openbios.bin':`${id}-${crypto.createHash('sha256').update(data).digest('hex').slice(0,16)}.bin`;

 images.push({name,data,label:path.basename(file)});}

 let labels={};try{labels=JSON.parse(await fs.readFile(path.join(dir,'bios-labels.json'),'utf8'));}catch{}for(const image of images){await fs.writeFile(path.join(dir,image.name),image.data);labels[image.name]=image.label;count++;}await fs.writeFile(path.join(dir,'bios-labels.json'),JSON.stringify(labels));return count;

 }

 async removeBios(id,file){

 if(!this.check(id).bios)throw Error('Esta plataforma não usa importação de BIOS.');if(typeof file!=='string'||!file||path.basename(file)!==file)throw Error('BIOS inválida.');

 const state=(await this.status())[id];if(!state.bios.includes(file))throw Error('BIOS indisponível.');

 const dir=this.biosDirectory(id);

 let labels={};try{labels=JSON.parse(await fs.readFile(path.join(dir,'bios-labels.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}

 delete labels[file];await fs.writeFile(path.join(dir,'bios-labels.json'),JSON.stringify(labels));

 if(id==='ps1'){const alias=path.join(this.data,'sessions','ps1','firmware','psxonpsp660.bin');try{const [staged,original]=await Promise.all([fs.readFile(alias),fs.readFile(path.join(dir,file))]);if(staged.equals(original))await fs.unlink(alias);}catch(e){if(e.code!=='ENOENT')throw e;}}

 await fs.unlink(path.join(dir,file));

 }

 async prepare(id,game,fullboot,preferences={}){const engine=this.check(id);if(engine.modern)return this.modern.prepare(id,game,preferences);const status=(await this.status())[id];const arcade=id==='mame'&&game?await this.arcade.prepare(game.path,preferences):null;if(!status.available)throw Error('Motor integrado ausente. Use o pacote completo do Kaliw.');if(engine.bios&&!status.bios.length)throw Error(`Importe sua BIOS de ${id.toUpperCase()} no menu BIOS antes de jogar.`);

 if(!game&&!engine.boot)throw Error('Escolha um jogo desta plataforma na aba Jogos.');

 if(id==='wii'){await require('./bundled-assets.cjs').prepareDolphin(this.bundle,this.systemFor(id));}

 if(game){try{await fs.access(game.path);}catch{throw Error('O arquivo do jogo foi movido ou removido. Importe-o novamente.');}}

 const base=path.join(this.data,'sessions',id);const saves=path.join(this.data,'saves',id),states=path.join(this.data,'states',id),logs=path.join(this.data,'logs');

 for(const dir of [base,saves,states,logs,path.join(this.system,'pcsx2','memcards'),path.join(this.system,'pcsx2','cheats'),path.join(this.data,'cache')])await fs.mkdir(dir,{recursive:true});

 const chosen=preferences.bios?.[id]||'';

 if(chosen&&!status.bios.includes(chosen))throw Error('A BIOS selecionada não está disponível. Escolha outra no menu BIOS.');

 let system=this.systemFor(id);const env={KALIW_PS1_BIOS:'',KALIW_PS2_BIOS:'',KALIW_CORE:arcade?.core||path.join(this.bundle,'cores',engine.file),KALIW_BRIDGE:path.join(base,'ipc-'+crypto.randomUUID())};

 if(id==='ps1'&&chosen){system=path.join(base,'firmware');await fs.mkdir(system,{recursive:true});await fs.copyFile(path.join(this.biosDirectory(id),chosen),path.join(system,'psxonpsp660.bin'));env.KALIW_PS1_BIOS='psxonpsp660.bin';}

 if(id==='ps2'&&chosen)env.KALIW_PS2_BIOS=chosen;

 const shortcuts=require('./shortcuts.js').normalize(preferences.controls?.shortcuts);

 env.KALIW_MENU_KEYS=shortcuts.menuKeys.map(require('./shortcuts.js').keyVk).join(',');env.KALIW_MENU_BUTTONS=shortcuts.menuButtons.map(b=>require('./shortcuts.js').masks[b]).join(',');env.KALIW_HOST_PID=String(process.pid);

 await fs.mkdir(env.KALIW_BRIDGE,{recursive:true});

 const optionsPath=path.join(base,'core-options.cfg');

 const controls=require('./input-config.cjs').generate(preferences.controls,id);

 const wiiDevice=({remote:'upright',sideways:'sideways',nunchuk:'nunchuk',classic:'classic',motion:'motionplus_nunchuk'})[require('./input-config.cjs').normalize(preferences.controls).wiiType];
 const opts=[...controls.options,line('dolphin_ir_mode',require('./input-config.cjs').normalize(preferences.controls).wiiPointer==='stick'?'1':'2'),line('dolphin_wiimote_default_device',wiiDevice),line('dolphin_bluetooth_passthrough','disabled'),line('dolphin_alt_gc_ports_on_wii','disabled'),line('dolphin_save_load_settings','disabled'),line('gambatte_gb_bootloader','enabled'),line('mgba_use_bios','ON'),line('gearsystem_bios_sms',(await require('./optional-firmware.cjs').files(this.systemFor('sms'),'sms')).length?'Enabled':'Disabled'),line('mupen64plus-rdp-plugin','gliden64'),line('dolphin_cpu_core','JIT64'),line('dolphin_renderer','Hardware'),line('swanstation_BIOS_PatchFastBoot',fullboot?'false':'true'),line('swanstation_GPU_Renderer','Software'),line('pcsx2_renderer','vulkan'),line('pcsx2_gsdump_trigger','disabled'),line('pcsx2_fast_boot',fullboot?'disabled':'enabled'),line('pcsx2_bios',chosen||status.bios[0])];

 // Empty region overrides let SwanStation identify the correct BIOS by its

 // contents, rather than forcing the first imported image on every region.

 const ps1Bios=(await this.status()).ps1.bios;

 const onlyOpenBios=ps1Bios.length===1&&ps1Bios[0]==='openbios.bin';

 for(const region of ['NTSCJ','NTSCU','PAL'])opts.push(line('swanstation_BIOS_Path'+region,id==='ps1'&&chosen?'psxonpsp660.bin':onlyOpenBios?'openbios.bin':region==='NTSCJ'?'scph5500.bin':region==='NTSCU'?'scph5501.bin':'scph5502.bin'));

 await fs.writeFile(optionsPath,opts.join('\n')+'\n');

 const cfg=[line('system_directory',system),line('savefile_directory',saves),line('savestate_directory',states),line('cache_directory',path.join(this.data,'cache')),line('core_options_path',optionsPath),line('global_core_options',true),line('game_specific_options',false),line('libretro_info_path',path.join(this.bundle,'info')),line('joypad_autoconfig_dir',path.join(this.bundle,'autoconfig')),

 line('video_driver',id==='ps2'?'vulkan':engine.video||'gl'),line('audio_driver','wasapi'),line('input_driver','dinput'),line('input_joypad_driver','sdl2'),line('video_fullscreen',true),line('video_windowed_fullscreen',true),line('video_vsync',true),line('video_shader_enable',false),line('config_save_on_exit',false),line('savefiles_in_content_dir',false),line('savestates_in_content_dir',false),line('sort_savefiles_enable',true),line('sort_savestates_enable',true),line('autosave_interval',10),line('savestate_auto_save',!engine.noStates),line('savestate_auto_load',false),line('log_verbosity',true),line('menu_driver','rgui'),line('menu_show_online_updater',false),line('menu_show_load_content',false),line('menu_show_load_core',false),line('menu_show_quit_retroarch',true),line('menu_enable_widgets',false),line('video_font_enable',true),line('pause_nonactive',false),line('menu_pause_libretro',false),line('quit_press_twice',false),line('ui_companion_enable',false),line('history_list_enable',false),line('core_info_cache_enable',false),line('input_remapping_directory',path.join(this.data,'remaps')),line('playlist_directory',path.join(this.data,'playlists')),line('quit_on_close_content',1),line('load_dummy_on_core_shutdown',false),line('input_exit_emulator','nul'),line('input_menu_toggle','nul'),line('input_save_state','f2'),line('input_load_state','f4'),line('input_toggle_fast_forward','nul'),line('input_enable_hotkey','nul'),line('input_grab_mouse_toggle','nul'),line('input_pause_toggle','nul'),line('input_shader_next','nul'),line('input_shader_prev','nul'),...controls.cfg];

 const configPath=path.join(base,'retroarch.cfg');await fs.writeFile(configPath,cfg.join('\n')+'\n');

 const log=path.join(logs,`${id}-${Date.now()}.log`);

 const args=['--config',configPath,'--verbose','--log-file',log,'--fullscreen','-L',path.join(this.bundle,'cores','kaliw_discbridge_libretro.dll')];if(game)args.push(arcade?.gamePath||game.path);

 if(arcade?.native){env.KALIW_BORDERLESS='1';return {exe:path.join(this.bundle,'kaliw-engine-host.exe'),args:[arcade.exe,...arcade.args],cwd:arcade.cwd,engine:arcade.name,log,env,bridge:env.KALIW_BRIDGE,bios:'none',modern:true,identity:arcade.exe,saveStates:false};}
 return {exe:path.join(this.bundle,'retroarch.exe'),args,cwd:arcade?.cwd||(id==='ps2'?base:this.bundle),engine:arcade?.name||engine.name,log,env,bridge:env.KALIW_BRIDGE,bios:engine.bios?(chosen||'auto'):'none'};

 }

}

module.exports={EngineManager};

