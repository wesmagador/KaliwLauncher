// The RPCS3 HID handler owns its controller; reuse the launcher's SDL reader for menu chords.
const Shortcuts=require('./shortcuts.js');
class MenuInput{constructor(options){this.options=options;this.held=false;this.busy=false;const koffi=require('koffi'),u=koffi.load('user32.dll');this.front=u.func('uintptr_t __stdcall GetForegroundWindow()');this.owner=u.func('uint32_t __stdcall GetWindowThreadProcessId(uintptr_t,_Out_ uint32_t*)');}
start(){this.timer=setInterval(async()=>{if(this.busy)return;this.busy=true;try{const down=require('./input-devices.cjs').snapshot().some(d=>Shortcuts.chordPad(this.options.shortcuts().menuButtons,d));const edge=down&&!this.held;this.held=down;if(!edge)return;const pid=[0];this.owner(this.front(),pid);if(pid[0]!==this.options.pid()&&pid[0]!==process.pid)return;await this.options.toggle();}catch(e){this.options.onError?.(e);}finally{this.busy=false;}},20);this.timer.unref();}
dispose(){clearInterval(this.timer);}}
module.exports={MenuInput};
