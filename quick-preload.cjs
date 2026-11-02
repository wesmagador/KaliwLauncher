const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('quickMenu',{games:()=>ipcRenderer.invoke('quick-library'),selectGame:id=>ipcRenderer.invoke('quick-game',id),state:()=>ipcRenderer.invoke('quick-state'),command:action=>ipcRenderer.invoke('quick-action',action),input:()=>ipcRenderer.invoke('quick-input'),onChanged:fn=>ipcRenderer.on('quick-changed',(_,state)=>fn(state))});

