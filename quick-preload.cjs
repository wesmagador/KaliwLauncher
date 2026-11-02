const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('quickMenu',{getAudio:()=>ipcRenderer.invoke('audio-read'),saveAudio:value=>ipcRenderer.invoke('audio-save',value),onAudio:fn=>ipcRenderer.on('audio-changed',(_,value)=>fn(value)),games:()=>ipcRenderer.invoke('quick-library'),selectGame:id=>ipcRenderer.invoke('quick-game',id),state:()=>ipcRenderer.invoke('quick-state'),command:action=>ipcRenderer.invoke('quick-action',action),input:()=>ipcRenderer.invoke('quick-input'),onChanged:fn=>ipcRenderer.on('quick-changed',(_,state)=>fn(state))});

