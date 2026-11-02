let getState;
try{const koffi=require('koffi');getState=koffi.load('xinput1_4.dll').func('uint32_t __stdcall XInputGetState(uint32_t index, void *state)');}catch{}
function snapshot(){return Array.from({length:4},(_,slot)=>{const b=Buffer.alloc(16);if(!getState||getState(slot,b)!==0)return {slot,available:!!getState,connected:false};return {slot,available:true,connected:true,buttons:b.readUInt16LE(4),axes:[b.readInt16LE(8)/32768,-b.readInt16LE(10)/32768,b.readInt16LE(12)/32768,-b.readInt16LE(14)/32768,b[6]/255,b[7]/255]};});}
module.exports={snapshot};
