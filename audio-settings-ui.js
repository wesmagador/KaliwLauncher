(()=>{
const enabled=document.getElementById('uiSounds'),volume=document.getElementById('uiSoundVolume'),label=document.getElementById('uiSoundValue');
function showAudio(){const value=KaliwAudio.settings();enabled.checked=value.enabled;volume.value=Math.round(value.volume*100);label.textContent=volume.value+'%';}
KaliwAudio.ready.then(()=>{showAudio();KaliwAudio.play('startup');});window.addEventListener('kaliw-audio-changed',showAudio);
enabled.onchange=()=>KaliwAudio.save({enabled:enabled.checked,volume:Number(volume.value)/100}).catch(e=>window.toast?.(e.message));volume.oninput=()=>KaliwAudio.setLocal({enabled:enabled.checked,volume:Number(volume.value)/100});volume.onchange=()=>{KaliwAudio.save({enabled:enabled.checked,volume:Number(volume.value)/100}).then(()=>KaliwAudio.play('confirm')).catch(e=>window.toast?.(e.message));};

})();
