const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const engines = {
 ps1: {name:'SwanStation',file:'swanstation_libretro.dll'},
 ps2: {name:'PCEE2',file:'pcee2_libretro.dll'}
};
const quote = value => '"'+String(value).replaceAll('\\','/').replaceAll('"','')+'"';
const line = (key,value) => `${key} = ${quote(value)}`;
class EngineManager {
 constructor(bundle,data){this.bundle=bundle;this.data=data;this.system=path.join(data,'system');}
 check(id){if(!engines[id])throw Error('Console inválido');return engines[id];}
 isOpenBios(data){return crypto.createHash('sha256').update(data).digest('hex')==='0a9685d9895b422f091a9bcceed8f73cf67a414c09eb8310c714f27ccdfdb349';}
 isBios(id,data){return id==='ps1'?data.length===524288&&(data.includes(Buffer.from('Sony Computer Entertainment'))||this.isOpenBios(data)):id==='ps2'&&data.length===4194304&&data.includes(Buffer.from('ROMDIR'))&&data.includes(Buffer.from('RESET'));}
 async status(){const result={};for(const [id,engine] of Object.entries(engines)){let available=true;for(const f of ['retroarch.exe',path.join('cores',engine.file)]){try{await fs.access(path.join(this.bundle,f));}catch{available=false;}}
 const dir=id==='ps1'?this.system:path.join(this.system,'pcsx2','bios');let bios=[];try{bios=(await fs.readdir(dir)).filter(f=>/\.bin$/i.test(f));}catch{}
 let biosLabels={};try{biosLabels=JSON.parse(await fs.readFile(path.join(dir,'bios-labels.json'),'utf8'));}catch{}
 result[id]={name:engine.name,available,bios,biosLabels};}return result;}
 async importBios(id,files){this.check(id);const dir=id==='ps1'?this.system:path.join(this.system,'pcsx2','bios');await fs.mkdir(dir,{recursive:true});let count=0;
 // Validate all selected images before changing the managed firmware directory.
 const images=[];for(const file of files){const data=await fs.readFile(file);if(!/\.bin$/i.test(file))throw Error('Importe uma BIOS descompactada no formato .bin.');
 if(!this.isBios(id,data))throw Error(id==='ps1'?'Importe uma BIOS de PS1 de 512 KB ou o OpenBIOS verificado.':'A BIOS de PS2 precisa ser uma imagem válida de 4 MB.');
 const name=id==='ps1'&&this.isOpenBios(data)?'openbios.bin':`${id}-${crypto.createHash('sha256').update(data).digest('hex').slice(0,16)}.bin`;
 images.push({name,data,label:path.basename(file)});}
 let labels={};try{labels=JSON.parse(await fs.readFile(path.join(dir,'bios-labels.json'),'utf8'));}catch{}for(const image of images){await fs.writeFile(path.join(dir,image.name),image.data);labels[image.name]=image.label;count++;}await fs.writeFile(path.join(dir,'bios-labels.json'),JSON.stringify(labels));return count;
 }
 async removeBios(id,file){
 this.check(id);if(typeof file!=='string'||!file||path.basename(file)!==file)throw Error('BIOS inválida.');
 const state=(await this.status())[id];if(!state.bios.includes(file))throw Error('BIOS indisponível.');
 const dir=id==='ps1'?this.system:path.join(this.system,'pcsx2','bios');
 let labels={};try{labels=JSON.parse(await fs.readFile(path.join(dir,'bios-labels.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 delete labels[file];await fs.writeFile(path.join(dir,'bios-labels.json'),JSON.stringify(labels));
 await fs.unlink(path.join(dir,file));
 }
 async prepare(id,game,fullboot,preferences={}){const engine=this.check(id);const status=(await this.status())[id];if(!status.available)throw Error('Motor integrado ausente. Use o pacote completo do Kaliw.');if(!status.bios.length)throw Error(`Importe sua BIOS de ${id.toUpperCase()} no menu BIOS antes de jogar.`);
 if(game){try{await fs.access(game.path);}catch{throw Error('O arquivo do jogo foi movido ou removido. Importe-o novamente.');}}
 const base=path.join(this.data,'sessions',id);const saves=path.join(this.data,'saves',id),states=path.join(this.data,'states',id),logs=path.join(this.data,'logs');
 for(const dir of [base,saves,states,logs,path.join(this.system,'pcsx2','memcards'),path.join(this.system,'pcsx2','cheats'),path.join(this.data,'cache')])await fs.mkdir(dir,{recursive:true});
 const chosen=preferences.bios?.[id]||'';
 if(chosen&&!status.bios.includes(chosen))throw Error('A BIOS selecionada não está disponível. Escolha outra no menu BIOS.');
 const optionsPath=path.join(base,'core-options.cfg');
 const controls=require('./input-config.cjs').generate(preferences.controls,id);
 const opts=[...controls.options,line('swanstation_BIOS_PatchFastBoot',fullboot?'false':'true'),line('swanstation_GPU_Renderer','Software'),line('pcsx2_renderer','opengl'),line('pcsx2_fast_boot',fullboot?'disabled':'enabled'),line('pcsx2_bios',chosen||status.bios[0])];
 // Empty region overrides let SwanStation identify the correct BIOS by its
 // contents, rather than forcing the first imported image on every region.
 const ps1Bios=(await this.status()).ps1.bios;
 const onlyOpenBios=ps1Bios.length===1&&ps1Bios[0]==='openbios.bin';
 for(const region of ['NTSCJ','NTSCU','PAL'])opts.push(line('swanstation_BIOS_Path'+region,id==='ps1'&&chosen?chosen:onlyOpenBios?'openbios.bin':''));
 await fs.writeFile(optionsPath,opts.join('\n')+'\n');
 const cfg=[line('system_directory',this.system),line('savefile_directory',saves),line('savestate_directory',states),line('cache_directory',path.join(this.data,'cache')),line('core_options_path',optionsPath),line('global_core_options',true),line('game_specific_options',false),line('libretro_info_path',path.join(this.bundle,'info')),line('joypad_autoconfig_dir',path.join(this.bundle,'autoconfig')),
 line('video_driver',id==='ps2'?'glcore':'gl'),line('audio_driver','wasapi'),line('input_driver','dinput'),line('input_joypad_driver','xinput'),line('video_fullscreen',true),line('video_windowed_fullscreen',true),line('video_vsync',true),line('video_shader_enable',false),line('config_save_on_exit',false),line('savefiles_in_content_dir',false),line('savestates_in_content_dir',false),line('sort_savefiles_enable',true),line('sort_savestates_enable',true),line('autosave_interval',10),line('savestate_auto_save',true),line('savestate_auto_load',false),line('log_verbosity',true),line('menu_driver','rgui'),line('menu_show_online_updater',false),line('menu_show_load_content',false),line('menu_show_load_core',false),line('menu_show_quit_retroarch',true),line('menu_enable_widgets',false),line('video_font_enable',true),line('pause_nonactive',true),line('quit_press_twice',false),line('ui_companion_enable',false),line('history_list_enable',false),line('core_info_cache_enable',false),line('input_remapping_directory',path.join(this.data,'remaps')),line('playlist_directory',path.join(this.data,'playlists')),line('quit_on_close_content',true),line('input_exit_emulator','escape'),line('input_menu_toggle','f1'),line('input_save_state','f2'),line('input_load_state','f4'),line('input_toggle_fast_forward','nul'),...controls.cfg];
 const configPath=path.join(base,'retroarch.cfg');await fs.writeFile(configPath,cfg.join('\n')+'\n');
 const log=path.join(logs,`${id}-${Date.now()}.log`);
 const args=['--config',configPath,'--verbose','--log-file',log,'--fullscreen','-L',path.join(this.bundle,'cores',engine.file)];if(game)args.push(game.path);
 return {exe:path.join(this.bundle,'retroarch.exe'),args,cwd:this.bundle,log};
 }
}
module.exports={EngineManager};
