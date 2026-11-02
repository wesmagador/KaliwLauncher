// Extract app-local runtime files from the signed Microsoft redistributable.
// Does not install or modify system libraries.
const fs=require('node:fs/promises');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
async function main(){
 const root=path.resolve(__dirname,'..'),cache=path.join(root,'.build-runtime','downloads'),stage=path.join(root,'.build-runtime','vcredist-stage');
 const exe=path.join(cache,'vc_redist.x64.exe');const seven=process.env.KALIW_7ZA||path.join(process.env.LOCALAPPDATA,'electron-builder','Cache','7zip@1.0.0','7zip-win-x64-a34pt','bin','7za.exe');await fs.mkdir(cache,{recursive:true});await fs.mkdir(stage,{recursive:true});
 try{await fs.access(exe);}catch{const r=await fetch('https://aka.ms/vs/17/release/vc_redist.x64.exe');if(!r.ok)throw Error('Microsoft runtime download failed');await fs.writeFile(exe,Buffer.from(await r.arrayBuffer()));}
 const script=`$s=Get-AuthenticodeSignature -LiteralPath '${exe.replaceAll("'","''")}'; if($s.Status -ne 'Valid' -or $s.SignerCertificate.Subject -notmatch 'Microsoft Corporation'){exit 1}`;
 execFileSync('pwsh.exe',['-NoProfile','-Command',script],{stdio:'inherit'});
 const bytes=await fs.readFile(exe),cabs=[];let offset=0;
 while((offset=bytes.indexOf(Buffer.from('MSCF'),offset))!==-1){const size=bytes.readUInt32LE(offset+8);if(size>0&&offset+size<=bytes.length)cabs.push(bytes.subarray(offset,offset+size));offset+=4;}
 if(cabs.length!==2)throw Error('Unexpected Microsoft package format; review before extracting.');
 const unpack=async(buffer,name)=>{const cab=path.join(stage,name+'.cab'),dir=path.join(stage,name);await fs.writeFile(cab,buffer);execFileSync(seven,['x',cab,'-o'+dir,'-y'],{stdio:'ignore'});return dir;};
 const ux=await unpack(cabs[0],'ux'),payload=await unpack(cabs[1],'payload');const xml=await fs.readFile(path.join(ux,'0'),'utf8');
 const entries=[...xml.matchAll(/<Payload\s+([^>]+)\/?\s*>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/([A-Za-z]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])));
 const minimum=entries.find(p=>p.FilePath?.includes('vcRuntimeMinimum_amd64')&&p.FilePath.endsWith('cab1.cab'));
 if(!minimum)throw Error('Expected x64 payload not found');
 const files=await unpack(await fs.readFile(path.join(payload,minimum.SourcePath)),'runtime');
 for(const file of await fs.readdir(files))if(file.endsWith('.dll_amd64'))await fs.copyFile(path.join(files,file),path.join(root,'engines',file.replace(/_amd64$/,'')));
 const license=entries.find(p=>p.FilePath==='license.rtf');await fs.copyFile(path.join(ux,license.SourcePath),path.join(root,'engines','licenses','Microsoft-Visual-CPP-License.rtf'));
 const notice='\nMicrosoft Visual C++ x64 runtime: app-local libraries from the Microsoft-signed official redistributable at https://aka.ms/vs/17/release/vc_redist.x64.exe. See Microsoft-Visual-CPP-License.rtf. These are separate Microsoft components, not covered by the GPL.\n';
 await fs.appendFile(path.join(root,'engines','licenses','THIRD-PARTY-NOTICES.txt'),notice);
 console.log('Microsoft C++ app-local runtime prepared; no system installation performed.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
