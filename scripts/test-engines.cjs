const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {EngineManager}=require('../engine-manager.cjs');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
async function main(){
 const root=path.resolve(__dirname,'..');const data=await fs.mkdtemp(path.join(root,'.build-runtime','engine-test-'));
 const manager=new EngineManager(path.join(root,'engines'),data);
 let status=await manager.status();assert.ok(status.ps1.available&&status.ps2.available,'Both engines must be bundled');
 await assert.rejects(()=>manager.prepare('ps1',null,true),/BIOS/);
 const invalid=path.join(data,'invalid.bin');await fs.writeFile(invalid,Buffer.alloc(100));await assert.rejects(()=>manager.importBios('ps2',[invalid]),/4 MB/);
 const fixture=Buffer.alloc(524288);fixture.write('Sony Computer Entertainment',100);const source=path.join(data,'fixture.bin');await fs.writeFile(source,fixture);
 await manager.importBios('ps1',[source]);await fs.unlink(source);status=await manager.status();assert.equal(status.ps1.bios.length,1,'BIOS copied rather than linked');
 const launch=await manager.prepare('ps1',null,true);assert.equal(launch.exe,path.join(root,'engines','retroarch.exe'));assert.ok(launch.args.includes('-L'));assert.ok(!launch.args.some(x=>x.includes('duckstation.exe')));
 const config=await fs.readFile(path.join(data,'sessions','ps1','retroarch.cfg'),'utf8');assert.ok(config.includes(data.replaceAll('\\','/')));assert.match(config,/savefile_directory/);
 const opts=await fs.readFile(path.join(data,'sessions','ps1','core-options.cfg'),'utf8');assert.match(opts,/swanstation_BIOS_PatchFastBoot = "false"/);
 await manager.prepare('ps1',null,false);assert.match(await fs.readFile(path.join(data,'sessions','ps1','core-options.cfg'),'utf8'),/PatchFastBoot = "true"/);
 // Native tests use the core's menu mode, with no Sony firmware or game content.
 const native=path.join(data,'native.cfg');await fs.writeFile(native,'video_driver = "gl"\naudio_driver = "null"\nmenu_driver = "rgui"\nconfig_save_on_exit = "false"\nvideo_fullscreen = "false"\nui_companion_enable = "false"\nvideo_font_enable = "false"\nhistory_list_enable = "false"\ncore_info_cache_enable = "false"\nuser_language = "0"\n');
 for(const id of ['ps1','ps2']){const file=id==='ps1'?'swanstation':'pcsx2';const log=path.join(data,id+'.log');await promisify(execFile)(path.join(root,'engines','retroarch.exe'),['--config',native,'--verbose','--log-file',log,'--max-frames','3','-L',path.join(root,'engines','cores',file+'_libretro.dll')],{cwd:path.join(root,'engines'),windowsHide:true,timeout:30000}).catch(error=>{if(error.killed||error.code==='ENOENT')throw error;});const text=await fs.readFile(log,'utf8');assert.ok(text.includes(file+'_libretro.dll'),'Core library should be selected');assert.match(text,/SET_SUPPORT_NO_GAME/);assert.ok(!text.includes('Failed to open libretro core'),'Core DLL must load');console.log(id+': native core loaded; contentless boot supported; firmware correctly absent');}
 console.log('Integrated paths, firmware rejection/import, persistent data and boot options passed.');
 await fs.writeFile(path.join(root,'artifacts','engines-test-result.json'),JSON.stringify({passed:true,nativeCores:['ps1','ps2'],data,gameplayValidated:false},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
