const fs=require('node:fs/promises');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const {EngineManager}=require('../engine-manager.cjs');
async function main(){
 const root=path.resolve(__dirname,'..'),test=JSON.parse(await fs.readFile(path.join(root,'artifacts','downloads-test-result.json'),'utf8'));
 const engine=new EngineManager(path.join(root,'engines'),test.data),game=test.games.find(g=>g.console==='ps1');const plan=await engine.prepare('ps1',game,true);
 const override=path.join(test.data,'graphics-test.cfg');await fs.writeFile(override,'video_fullscreen = "false"\naudio_enable = "false"\npause_nonactive = "false"\n');
 const screenshot=path.join(root,'artifacts','Tetrade-OpenBIOS.png');const args=plan.args.filter(arg=>arg!=='--fullscreen').concat(['--appendconfig',override,'--max-frames=1500','--max-frames-ss','--max-frames-ss-path='+screenshot]);
 await promisify(execFile)(plan.exe,args,{cwd:plan.cwd,env:{...process.env,...plan.env},windowsHide:true,timeout:45000});const png=await fs.readFile(screenshot);const chunks=[];for(let p=8;p+12<=png.length;){const size=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+size));p+=12+size;}const raw=require('node:zlib').inflateSync(Buffer.concat(chunks));if(new Set(raw).size<12)throw Error('The rendered screenshot is blank; gameplay not confirmed.');
 const log=await fs.readFile(plan.log,'utf8');if(/Failed to load content|No BIOS image found|System failed to boot/.test(log))throw Error('PS1 content did not boot');
 await fs.writeFile(path.join(root,'artifacts','ps1-game-test-result.json'),JSON.stringify({passed:true,game:'Tetrade',firmware:'OpenBIOS',frames:1500,screenshot,log:plan.log,audioTested:false},null,2));
 console.log('Tetrade + OpenBIOS: 1500 frames rendered, screenshot saved.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
