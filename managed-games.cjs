const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const inside=(root,file)=>{const rel=path.relative(root,file);return rel===''||!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel);};
async function importGame(layout,id,input,copyDirectory){
 const games=layout.games(id);let file=await fs.realpath(input);
 if(id==='ps1'&&path.extname(file).toLowerCase()==='.bin'){const cue=file.slice(0,-4)+'.cue';try{if((await fs.stat(cue)).isFile())file=await fs.realpath(cue);}catch(e){if(e.code!=='ENOENT')throw e;}}
 if(inside(games,file))return file;
 const stat=await fs.stat(file),key=crypto.createHash('sha256').update(file+'|'+stat.size+'|'+stat.mtimeMs).digest('hex').slice(0,24);
 const dest=path.join(games,key);let root=path.dirname(file),whole=false;
 if(id==='ps3'&&path.basename(file).toUpperCase()==='EBOOT.BIN'){let dir=root;while(path.dirname(dir)!==dir){if(path.basename(dir).toUpperCase()==='PS3_GAME'){root=dir;whole=true;break;}dir=path.dirname(dir);}if(!whole)throw Error('Selecione EBOOT.BIN dentro de PS3_GAME.');}
 if(id==='ps4'&&path.basename(file).toLowerCase()==='eboot.bin')whole=true;
 if(id==='wiiu'&&path.extname(file).toLowerCase()==='.rpx'&&path.basename(root).toLowerCase()==='code'){root=path.dirname(root);whole=true;}
 const entry=path.join(dest,path.relative(root,file));try{await fs.access(path.join(dest,'.complete'));await fs.access(entry);return entry;}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.mkdir(games,{recursive:true});const stage=await fs.mkdtemp(path.join(games,'.import-'));
 try{
  if(whole)await copyDirectory(root,stage);
  else {const seen=new Set();async function copy(source,depth=0){if(depth>8||seen.size>10000)throw Error('Lista de discos excede os limites.');const real=await fs.realpath(source);if(!inside(root,real))throw Error('CUE/M3U referencia arquivo fora da pasta do jogo. Organize as faixas e discos na mesma pasta.');if(seen.has(real))return;seen.add(real);const target=path.join(stage,path.relative(root,source));await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(real,target);const ext=path.extname(source).toLowerCase();if(!['.cue','.m3u'].includes(ext))return;if((await fs.stat(source)).size>1024*1024)throw Error('Lista de discos inválida.');const text=await fs.readFile(source,'utf8'),refs=ext==='.cue'?[...text.matchAll(/^\s*FILE\s+(?:"([^"]+)"|(\S+))\s+/gim)].map(m=>m[1]||m[2]):text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));for(const ref of refs){if(path.isAbsolute(ref)||/^[a-z]+:/i.test(ref))throw Error('Use caminhos relativos nos arquivos CUE/M3U.');await copy(path.resolve(path.dirname(source),ref),depth+1);}}
   await copy(file);
  }
  await fs.writeFile(path.join(stage,'.complete'),key);await fs.rename(stage,dest);return entry;
 }catch(e){if(path.dirname(stage)===games)await fs.rm(stage,{recursive:true,force:true});throw e;}
}
module.exports={importGame,inside};
