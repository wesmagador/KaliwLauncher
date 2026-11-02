const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const entries=require('../catalog.cjs');
const {OnlineManager}=require('../online-manager.cjs');
const {EngineManager}=require('../engine-manager.cjs');
async function main(){
 const root=path.resolve(__dirname,'..'),data=await fs.mkdtemp(path.join(root,'.build-runtime','downloads-test-'));const engine=new EngineManager(path.join(root,'engines'),data);let installs=[],corrupt=false,slow=false,gets=0;
 const buffers={};for(const [id,file] of [['ps1-openbios','openbios'],['ps1-tetrade','TETRADE_PSX.bin'],['ps2-nim','nim']]){const cached=path.join(root,'.build-runtime','catalog',file);try{buffers[id]=await fs.readFile(cached);}catch(e){if(e.code!=='ENOENT')throw e;const entry=entries.find(e=>e.id===id);const response=await fetch(entry.url);if(!response.ok)throw Error('Test fixture unavailable: '+id);buffers[id]=Buffer.from(await response.arrayBuffer());await fs.mkdir(path.dirname(cached),{recursive:true});await fs.writeFile(cached,buffers[id]);}}
 const fetcher=async(url,options={})=>{const entry=entries.find(e=>e.url===url);if(options.method==='HEAD')return new Response(null,{status:200});gets++;if(!entry)return new Response('License text');if(corrupt)return new Response(Buffer.alloc(entry.bytes));if(slow){return new Response(new ReadableStream({start(controller){controller.enqueue(buffers[entry.id].subarray(0,10));options.signal.addEventListener('abort',()=>controller.error(Error('aborted')),{once:true});}}));}return new Response(buffers[entry.id]);};
 const install=async(entry,file)=>{if(entry.kind==='bios')await engine.importBios(entry.console,[file]);else installs.push({id:entry.id,path:file});};
 const online=new OnlineManager({data,engines:engine,fetcher,install});
 assert.equal((await online.list()).length,3);await online.refresh();assert.equal(gets,0,'Listing/checking must not download payloads');await assert.rejects(()=>online.download('arbitrary-url'),/catálogo/);
 corrupt=true;await assert.rejects(()=>online.download('ps1-tetrade'),/SHA-256/);assert.equal(installs.length,0);await assert.rejects(()=>fs.access(online.destination(entries[1])));
 corrupt=false;slow=true;const canceled=online.download('ps1-tetrade');await new Promise(r=>setTimeout(r,20));online.cancel('ps1-tetrade');await assert.rejects(()=>canceled,/cancelado/);assert.equal(installs.length,0);slow=false;
 for(const item of entries)await online.download(item.id);assert.equal(installs.length,2);assert.equal((await engine.status()).ps1.bios[0],'openbios.bin');assert.ok((await online.list()).every(e=>e.downloaded));
 const query=await online.scan(path.join(data,'system'));assert.equal(query.found.length,1);await online.importCandidate(query.found[0].id);
 const restricted=new OnlineManager({data,engines:{status:async()=>({ps1:{available:true},ps2:{available:false}})},fetcher,install});assert.equal((await restricted.list()).length,2);await assert.rejects(()=>restricted.download('ps2-nim'),/não integrada/);
 const plan=await engine.prepare('ps1',{path:installs[0].path},true);const opts=await fs.readFile(path.join(data,'sessions','ps1','core-options.cfg'),'utf8');assert.match(opts,/PathNTSCU = "openbios.bin"/);assert.ok(plan.args.includes(installs[0].path));
 console.log('Catalog filters, explicit-only downloads, SHA-256 rejection, cancellation, installation, local BIOS discovery and OpenBIOS configuration passed.');
 // Verify the real author-hosted URLs and licenses into a test-only data folder.
 const liveData=await fs.mkdtemp(path.join(root,'.build-runtime','live-downloads-'));const liveEngine=new EngineManager(path.join(root,'engines'),liveData);const games=[];
 const live=new OnlineManager({data:liveData,engines:liveEngine,install:async(entry,file)=>{if(entry.kind==='bios')await liveEngine.importBios(entry.console,[file]);else games.push({name:entry.name,console:entry.console,path:file});}});
 for(const item of entries){await live.download(item.id);console.log('Verified author download and install:',item.name);}
 await fs.writeFile(path.join(root,'artifacts','downloads-test-result.json'),JSON.stringify({passed:true,data:liveData,games,catalog:entries.map(e=>e.id)},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
