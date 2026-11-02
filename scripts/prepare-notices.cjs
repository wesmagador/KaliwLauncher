const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const {createWriteStream}=require('node:fs');
const projects=[
 {id:'RetroArch',repo:'libretro/RetroArch',ref:'v1.22.2',license:'COPYING'},
 {id:'SwanStation',repo:'libretro/swanstation',ref:'631f0fb31b809e0f889d7c551fe695788e39c1d3',license:'LICENSE'},
 {id:'ParaLLEl-PS2',repo:'libretro/parallel-ps2',ref:'38d3a83f4ecdec977d609ece8afcc527f5f68702',license:'COPYING.GPLv3'}
];
async function main(){
 const root=path.resolve(__dirname,'..'),dir=path.join(root,'engines','licenses'),sources=path.join(root,'sources');await fs.mkdir(dir,{recursive:true});await fs.mkdir(sources,{recursive:true});
 await Promise.all(projects.map(async p=>{
 const prefix=`https://raw.githubusercontent.com/${p.repo}/${p.ref}/`;
 for(const file of [p.license,'README.md']){const r=await fetch(prefix+file);if(!r.ok)throw Error('Notices missing for '+p.id);await fs.writeFile(path.join(dir,`${p.id}-${file.replaceAll('/','-')}`),await r.text());}
 const url=`https://codeload.github.com/${p.repo}/zip/${p.ref}`;
 const dest=path.join(sources,p.id+'-'+p.ref+'.zip');try{await fs.access(dest);}catch{const r=await fetch(url,{signal:AbortSignal.timeout(600000)});if(!r.ok)throw Error('Source unavailable: '+p.id);await pipeline(Readable.fromWeb(r.body),createWriteStream(dest));}
 p.sourceArchive=url;p.sha256=crypto.createHash('sha256').update(await fs.readFile(dest)).digest('hex');console.log('Notices and source:',p.id);
 }));
 const notice=`KaliwLauncher 0.3 — Integrated emulation\n\nThe Kaliw interface is an independent frontend. Emulation is provided by the unmodified open-source programs below, included in this package. It is not an original PS1/PS2 emulation implementation. No Sony BIOS, firmware or games are included.\n\n${projects.map(p=>`${p.id}\nRepository: https://github.com/${p.repo}\nVersion/commit: ${p.ref}\nExact source archive: ${p.sourceArchive}\nArchive SHA-256: ${p.sha256}\nLicense: ${p.id}-${p.license}\nBuild instructions: ${p.id}-README.md\n`).join('\n')}\nThe native runtime may open a separate fullscreen window. All persistent BIOS and save data are managed under Kaliw's user-data directory, outside the application bundle.\nCore .info metadata supports_no_game is updated to true to match the bundled cores' runtime environment declaration. Core DLLs and the runtime are unmodified.\n\nSource archives for the exact revisions are delivered alongside the executable in KaliwLauncher-0.3.0-sources.zip. For external/submodule dependencies, follow the upstream build instructions and the pinned git submodule revisions in these sources; full repositories can be fetched using git clone --recursive followed by checkout of the version above and git submodule update --init --recursive.\n`;
 await fs.writeFile(path.join(dir,'THIRD-PARTY-NOTICES.txt'),notice);
 await fs.writeFile(path.join(sources,'THIRD-PARTY-NOTICES.txt'),notice);
 for(const name of ['swanstation','pcsx2']){const file=path.join(root,'engines','info',name+'_libretro.info');let text=await fs.readFile(file,'utf8');text=text.replace('supports_no_game = "false"','supports_no_game = "true"');await fs.writeFile(file,text);}
 const file=path.join(root,'engines','manifest.json');const manifest=JSON.parse(await fs.readFile(file,'utf8'));manifest.cores.ps1.version='1.0.0 631f0fb';manifest.cores.ps1.source='https://github.com/libretro/swanstation/tree/'+projects[1].ref;manifest.cores.ps2.name='ParaLLEl PS2';manifest.cores.ps2.version='v2.0.0-38d3a83';manifest.cores.ps2.source='https://github.com/libretro/parallel-ps2/tree/'+projects[2].ref;await fs.writeFile(file,JSON.stringify(manifest,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
