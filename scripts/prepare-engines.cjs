const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const {createWriteStream}=require('node:fs');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const cache=path.join(root,'.build-runtime','downloads');
const output=path.join(root,'engines');
const artifacts=[
 {name:'RetroArch.7z',url:'https://buildbot.libretro.com/stable/1.22.2/windows/x86_64/RetroArch.7z'},
 {name:'swanstation.zip',url:'https://buildbot.libretro.com/nightly/windows/x86_64/latest/swanstation_libretro.dll.zip'},
 {name:'pcee2.zip',url:'https://buildbot.libretro.com/nightly/windows/x86_64/latest/pcee2_libretro.dll.zip'}
];
async function download(item){const dest=path.join(cache,item.name);try{await fs.access(dest);console.log('Cached',item.name);return;}catch{}console.log('Downloading',item.name);const r=await fetch(item.url,{signal:AbortSignal.timeout(600000)});if(!r.ok)throw Error(`${r.status}: ${item.url}`);await pipeline(Readable.fromWeb(r.body),createWriteStream(dest+'.part'));await fs.rename(dest+'.part',dest);}
async function main(){
 await fs.mkdir(cache,{recursive:true});await fs.mkdir(output,{recursive:true});
 await Promise.all(artifacts.map(download));
 const pinned=['b2139b1d0f9d4526dc6b5ce23cbb3efdc766096fa6f2c3df016818b486ac6372','e716f609fa832f7b94739bdd4c19fe6975f58dccba2387523e2d9f20ebac7622','43435019e00538032422e86f73223b3a5d73a3298fb786c56e1d053678f15abf'];
 for(let i=0;i<artifacts.length;i++){const sum=crypto.createHash('sha256').update(await fs.readFile(path.join(cache,artifacts[i].name))).digest('hex');if(sum!==pinned[i])throw Error('The upstream artifact changed: '+artifacts[i].name+'. Review and pin a new version before packaging.');}
 const seven=process.env.KALIW_7ZA||path.join(process.env.LOCALAPPDATA,'electron-builder','Cache','7zip@1.0.0','7zip-win-x64-a34pt','bin','7za.exe');
 const extracted=path.join(cache,'retroarch');await fs.mkdir(extracted,{recursive:true});
 execFileSync(seven,['x',path.join(cache,'RetroArch.7z'),'-o'+extracted,'-y'],{stdio:'ignore'});
 let source=extracted;if(!(await fs.readdir(source)).includes('retroarch.exe'))source=path.join(source,'RetroArch-Win64');
 for(const entry of await fs.readdir(source,{withFileTypes:true}))if(entry.isFile()&&(/\.(exe|dll|txt|cfg)$/i.test(entry.name)||/copying|license|authors/i.test(entry.name)))await fs.copyFile(path.join(source,entry.name),path.join(output,entry.name));
 for(const name of ['autoconfig']){try{await fs.cp(path.join(source,name),path.join(output,name),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}}
 const cores=path.join(output,'cores');await fs.mkdir(cores,{recursive:true});
 for(const name of ['swanstation.zip','pcee2.zip'])execFileSync(seven,['x',path.join(cache,name),'-o'+cores,'-y'],{stdio:'ignore'});
 const infoDir=path.join(output,'info');await fs.mkdir(infoDir,{recursive:true});
 for(const name of ['swanstation','pcee2']){const r=await fetch(`https://raw.githubusercontent.com/libretro/libretro-core-info/master/${name}_libretro.info`);if(!r.ok)throw Error('Core info unavailable');await fs.writeFile(path.join(infoDir,`${name}_libretro.info`),await r.text());}
 const manifest={generatedAt:new Date().toISOString(),runtime:{name:'RetroArch',version:'1.22.2',source:'https://github.com/libretro/RetroArch/tree/v1.22.2'},cores:{ps1:{name:'SwanStation',file:'swanstation_libretro.dll',source:'https://github.com/libretro/swanstation'},ps2:{name:'PCEE2',file:'pcee2_libretro.dll',source:'https://github.com/WizzardSK/pcee2-libretro'}},artifacts:[]};
 for(const item of artifacts)manifest.artifacts.push({...item,sha256:crypto.createHash('sha256').update(await fs.readFile(path.join(cache,item.name))).digest('hex')});
 await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log('Integrated engines prepared at',output);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
