// Kaliw libretro disc bridge. MIT. Executes disc callbacks on the emulation thread.
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#define RETRO_API __declspec(dllexport)
#include "libretro.h"
static HMODULE core;static retro_environment_t frontend;static struct retro_disk_control_callback disk;
static char ipc[32768],pending[160],request[32768],response[32768];static ULONGLONG close_at,next_poll;
static void *symbol(const char*n){if(!core){wchar_t file[32768];GetEnvironmentVariableW(L"KALIW_CORE",file,32768);core=LoadLibraryW(file);}return core?(void*)GetProcAddress(core,n):NULL;}
static FILE *utfopen(const char*p,const wchar_t*mode){wchar_t w[32768];if(!MultiByteToWideChar(CP_UTF8,0,p,-1,w,32768))return NULL;return _wfopen(w,mode);}
static void reply(const char*id,int ok,const char*msg){char tmp[32768];snprintf(tmp,sizeof(tmp),"%s.tmp",response);FILE*f=utfopen(tmp,L"wb");if(!f)return;fprintf(f,"%s\n%s\n%s",id,ok?"OK":"ERROR",msg);fclose(f);wchar_t a[32768],b[32768];MultiByteToWideChar(CP_UTF8,0,tmp,-1,a,32768);MultiByteToWideChar(CP_UTF8,0,response,-1,b,32768);MoveFileExW(a,b,MOVEFILE_REPLACE_EXISTING);}
#define KALIW_LIBRETRO_MENU
#include "quick-menu.h"
#include "wii-pointer.h"
static bool environment(unsigned cmd,void*data){if(cmd==RETRO_ENVIRONMENT_SET_DISK_CONTROL_INTERFACE||cmd==RETRO_ENVIRONMENT_SET_DISK_CONTROL_EXT_INTERFACE)memcpy(&disk,data,sizeof(disk));
 if(cmd==RETRO_ENVIRONMENT_GET_VARIABLE){struct retro_variable*v=data;static char bios[1024];if(strncmp(v->key,"swanstation_BIOS_Path",21)==0&&GetEnvironmentVariableA("KALIW_PS1_BIOS",bios,sizeof(bios))){v->value=bios;return true;}if(strcmp(v->key,"pcsx2_bios")==0&&GetEnvironmentVariableA("KALIW_PS2_BIOS",bios,sizeof(bios))){v->value=bios;return true;}}
 return frontend?frontend(cmd,data):false;}
static void poll(void){ULONGLONG now=GetTickCount64();if(close_at){if(now>=close_at){int ok=disk.set_eject_state&&disk.set_eject_state(false);reply(pending,ok,ok?"Disco inserido":"O motor recusou o disco");close_at=0;}return;}if(now<next_poll)return;next_poll=now+25;
 FILE*f=utfopen(request,L"rb");if(!f)return;char id[160],op[32],path[32000];if(!fgets(id,sizeof(id),f)||!fgets(op,sizeof(op),f)){fclose(f);return;}id[strcspn(id,"\r\n")]=0;op[strcspn(op,"\r\n")]=0;size_t size=fread(path,1,sizeof(path)-1,f);path[size]=0;fclose(f);wchar_t wr[32768];MultiByteToWideChar(CP_UTF8,0,request,-1,wr,32768);DeleteFileW(wr);
 if(!strcmp(op,"FOCUS_MENU")){DWORD owner=0;GetWindowThreadProcessId(GetForegroundWindow(),&owner);if(menu_window&&(owner==GetCurrentProcessId()||owner==host_pid)){AllowSetForegroundWindow(host_pid);SetForegroundWindow(menu_window);}reply(id,1,"Menu ativo");return;}
 if(!strcmp(op,"OVERLAY")){HWND window=(HWND)(uintptr_t)strtoull(path,NULL,10);DWORD owner=0;GetWindowThreadProcessId(window,&owner);if(owner==host_pid){menu_window=window;reply(id,1,"Menu conectado");}else reply(id,0,"Janela de menu inválida");return;}
 if(!strcmp(op,"BINDINGS")){menu_bindings(path);reply(id,1,"Atalhos atualizados");return;}
 if(!strcmp(op,"PAUSE")){menu_paused=true;reply(id,1,"Console pausado");return;}
 if(!strcmp(op,"RESUME")){menu_paused=false;reply(id,1,"Console retomado");return;}
 if(!strcmp(op,"SAVE")||!strcmp(op,"LOAD")){bool loading=!strcmp(op,"LOAD");bool ok=state_file(path,loading);reply(id,ok,ok?(loading?"Estado carregado":"Estado salvo"):"Não foi possível salvar ou carregar este estado");return;}
 if(!strcmp(op,"QUIT")){reply(id,1,"Encerrando console");frontend(RETRO_ENVIRONMENT_SHUTDOWN,NULL);return;}
 if(!strcmp(op,"PING")){reply(id,1,"Ponte pronta");return;}
 if(!disk.get_num_images||!disk.set_eject_state||!disk.replace_image_index||!disk.add_image_index||!disk.set_image_index){reply(id,0,"O motor não oferece troca de discos");return;}
 if(!strcmp(op,"EJECT")){reply(id,disk.set_eject_state(true),"Bandeja aberta");return;}
 if(strcmp(op,"INSERT")||!path[0]){reply(id,0,"Comando inválido");return;}
 unsigned count=disk.get_num_images(),index=count;bool added=disk.add_image_index();if(!added||!disk.set_eject_state(true)){reply(id,0,"Não foi possível abrir a bandeja");return;}
 struct retro_game_info info={0};info.path=path;if(!disk.replace_image_index(index,&info)||!disk.set_image_index(index)){reply(id,0,"Não foi possível preparar este disco");return;}
 snprintf(pending,sizeof(pending),"%s",id);close_at=now+800;
}
#define V0(n) RETRO_API void n(void){void(*fn)(void)=symbol(#n);if(fn)fn();}
#define V1(n,t,a) RETRO_API void n(t a){void(*fn)(t)=symbol(#n);if(fn)fn(a);}
#define R0(r,n,d) RETRO_API r n(void){r(*fn)(void)=symbol(#n);return fn?fn():d;}
RETRO_API void retro_set_environment(retro_environment_t cb){frontend=cb;void(*fn)(retro_environment_t)=symbol("retro_set_environment");if(fn)fn(environment);}
RETRO_API void retro_init(void){wchar_t ipcw[32768];GetEnvironmentVariableW(L"KALIW_BRIDGE",ipcw,32768);WideCharToMultiByte(CP_UTF8,0,ipcw,-1,ipc,sizeof(ipc),NULL,NULL);snprintf(request,sizeof(request),"%s/request.txt",ipc);snprintf(response,sizeof(response),"%s/response.txt",ipc);void(*fn)(void)=symbol("retro_init");if(fn)fn();menu_init();pointer_init();}
RETRO_API void retro_deinit(void){pointer_shutdown();menu_sdl_shutdown();void(*fn)(void)=symbol("retro_deinit");if(fn)fn();}
V0(retro_reset) V0(retro_unload_game) V0(retro_cheat_reset)
RETRO_API void retro_run(void){pointer_refresh();static bool started=false;if(!started){void(*first)(void)=symbol("retro_run");if(first)first();started=true;}poll_menu_hotkey();poll();if(menu_paused){if(video_cb&&last_width)video_cb(NULL,last_width,last_height,last_pitch);Sleep(5);return;}void(*fn)(void)=symbol("retro_run");if(fn)fn();}
R0(unsigned,retro_api_version,1) R0(unsigned,retro_get_region,0) R0(size_t,retro_serialize_size,0)
V1(retro_get_system_info,struct retro_system_info*,info) V1(retro_get_system_av_info,struct retro_system_av_info*,info)
RETRO_API void retro_set_video_refresh(retro_video_refresh_t cb){video_cb=cb;void(*fn)(retro_video_refresh_t)=symbol("retro_set_video_refresh");if(fn)fn(video_forward);} V1(retro_set_audio_sample,retro_audio_sample_t,cb) V1(retro_set_audio_sample_batch,retro_audio_sample_batch_t,cb) RETRO_API void retro_set_input_poll(retro_input_poll_t cb){menu_input_poll=cb;void(*fn)(retro_input_poll_t)=symbol("retro_set_input_poll");if(fn)fn(cb);} RETRO_API void retro_set_input_state(retro_input_state_t cb){input_cb=cb;void(*fn)(retro_input_state_t)=symbol("retro_set_input_state");if(fn)fn(wii_input_forward);}
RETRO_API void retro_set_controller_port_device(unsigned p,unsigned d){void(*fn)(unsigned,unsigned)=symbol("retro_set_controller_port_device");if(fn)fn(p,d);}
RETRO_API bool retro_load_game(const struct retro_game_info*i){bool(*fn)(const struct retro_game_info*)=symbol("retro_load_game");return fn&&fn(i);}
RETRO_API bool retro_load_game_special(unsigned t,const struct retro_game_info*i,size_t n){bool(*fn)(unsigned,const struct retro_game_info*,size_t)=symbol("retro_load_game_special");return fn&&fn(t,i,n);}
RETRO_API bool retro_serialize(void*d,size_t n){bool(*fn)(void*,size_t)=symbol("retro_serialize");return fn&&fn(d,n);}
RETRO_API bool retro_unserialize(const void*d,size_t n){bool(*fn)(const void*,size_t)=symbol("retro_unserialize");return fn&&fn(d,n);}
RETRO_API void retro_cheat_set(unsigned i,bool e,const char*c){void(*fn)(unsigned,bool,const char*)=symbol("retro_cheat_set");if(fn)fn(i,e,c);}
RETRO_API void*retro_get_memory_data(unsigned i){void*(*fn)(unsigned)=symbol("retro_get_memory_data");return fn?fn(i):NULL;}
RETRO_API size_t retro_get_memory_size(unsigned i){size_t(*fn)(unsigned)=symbol("retro_get_memory_size");return fn?fn(i):0;}
