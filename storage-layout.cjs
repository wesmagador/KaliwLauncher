const fs=require('node:fs'),path=require('node:path');
const {platforms}=require('./platforms.js');
class StorageLayout{
 constructor(root){if(!path.isAbsolute(root)||root===path.parse(root).root)throw Error('Escolha uma pasta exclusiva para os dados do Kaliw.');this.root=path.resolve(root);this.userData=path.join(this.root,'Sistema','Launcher');this.data=path.join(this.root,'Sistema','emulation');}
 console(id){if(!platforms.some(p=>p.id===id))throw Error('Plataforma inválida.');return path.join(this.root,'Emuladores',id);}
 bios(id){return path.join(this.console(id),'BIOS');}
 games(id){return path.join(this.console(id),'Jogos');}
 initialize(){const marker=path.join(this.root,'kaliw-data.ini');if(!fs.existsSync(marker))throw Error('Pasta de dados não foi criada pelo instalador.');const text=readIni(marker);if(!/^Owner=com\.kaliw\.launcher\s*$/m.test(text))throw Error('Identificação da pasta de dados inválida.');for(const p of platforms)for(const dir of [this.bios(p.id),this.games(p.id)])fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(this.userData,{recursive:true});const link=path.join(this.data,'system','pcsx2','bios'),target=this.bios('ps2');fs.mkdirSync(path.dirname(link),{recursive:true});try{const stat=fs.lstatSync(link);if(!stat.isSymbolicLink()||fs.realpathSync(link).toLowerCase()!==fs.realpathSync(target).toLowerCase())throw Error('Pasta de BIOS PS2 aponta para outro local.');}catch(e){if(e.code!=='ENOENT')throw e;fs.symlinkSync(target,link,'junction');}return this;}
}
function readIni(file){const b=fs.readFileSync(file);return (b[0]===255&&b[1]===254?b.toString('utf16le'):b.toString('utf8')).replace(/^\uFEFF/,'');}
function installedRoot(exe){const file=path.join(path.dirname(exe),'kaliw-storage.ini');let text;try{text=readIni(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}const root=text.match(/^Root=(.+)\s*$/m)?.[1]?.trim();if(!root)throw Error('Instalação sem pasta de dados configurada.');return root;}
module.exports={StorageLayout,installedRoot};
