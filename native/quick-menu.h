// MIT. Local quick menu control and libretro state files.
#include <xinput.h>
#ifndef KALIW_LIBRETRO_MENU
#include "sdl-menu.h"
#else
#define menu_sdl_init() ((void)0)
#define menu_sdl_shutdown() ((void)0)
#endif
static bool menu_paused,combo_held;static unsigned key_pair[2]={VK_RCONTROL,VK_RETURN},button_pair[2]={XINPUT_GAMEPAD_START,XINPUT_GAMEPAD_BACK};
static HWND menu_window;static DWORD host_pid;static ULONGLONG event_counter;static retro_video_refresh_t video_cb;static retro_input_state_t input_cb;static unsigned last_width,last_height;static size_t last_pitch;
static DWORD(WINAPI *read_pad)(DWORD,XINPUT_STATE*);
#ifdef KALIW_LIBRETRO_MENU
static retro_input_poll_t menu_input_poll;
/* Use the frontend's already-owned controllers instead of opening SDL devices twice. */
static bool menu_sdl_chord(unsigned a,unsigned b){if(!input_cb)return false;if(menu_input_poll)menu_input_poll();static const unsigned masks[]={0x1000,0x4000,0x20,0x10,1,2,4,8,0x2000,0x8000,0x100,0x200,0x10000,0x20000,0x40,0x80};for(unsigned port=0;port<4;port++){unsigned pressed=0;for(unsigned id=0;id<16;id++)if(input_cb(port,RETRO_DEVICE_JOYPAD,0,id))pressed|=masks[id];if((pressed&a)&&(pressed&b))return true;}return false;}
#endif

static void menu_bindings(const char*text){unsigned a,b,c,d;if(sscanf(text,"%u,%u;%u,%u",&a,&b,&c,&d)==4&&a&&a<256&&b&&b<256&&a!=b&&c&&d&&c!=d){key_pair[0]=a;key_pair[1]=b;button_pair[0]=c;button_pair[1]=d;}}
static void menu_init(void){menu_sdl_init();char keys[64]={0},pads[64]={0},host[32]={0},all[160];GetEnvironmentVariableA("KALIW_MENU_KEYS",keys,sizeof(keys));GetEnvironmentVariableA("KALIW_MENU_BUTTONS",pads,sizeof(pads));snprintf(all,sizeof(all),"%s;%s",keys,pads);menu_bindings(all);GetEnvironmentVariableA("KALIW_HOST_PID",host,sizeof(host));host_pid=strtoul(host,NULL,10);if(GetEnvironmentVariableW(L"KALIW_NO_SDL_MENU",NULL,0))return;HMODULE lib=LoadLibraryExW(L"xinput1_4.dll",NULL,LOAD_LIBRARY_SEARCH_SYSTEM32);if(lib)read_pad=(void*)GetProcAddress(lib,"XInputGetState");}
static void menu_event(bool open,HWND foreground){char file[32768],tmp[32768];snprintf(file,sizeof(file),"%s/menu-event.txt",ipc);snprintf(tmp,sizeof(tmp),"%s/menu-event.tmp",ipc);RECT r={0};GetWindowRect(foreground,&r);FILE*f=utfopen(tmp,L"wb");if(!f)return;fprintf(f,"%llu\n%s\n%ld %ld %ld %ld",++event_counter,open?"OPEN":"CLOSE",r.left,r.top,r.right-r.left,r.bottom-r.top);fclose(f);wchar_t a[32768],b[32768];MultiByteToWideChar(CP_UTF8,0,tmp,-1,a,32768);MultiByteToWideChar(CP_UTF8,0,file,-1,b,32768);MoveFileExW(a,b,MOVEFILE_REPLACE_EXISTING);}
static void poll_menu_hotkey(void){bool down=(GetAsyncKeyState(key_pair[0])&0x8000)&&(GetAsyncKeyState(key_pair[1])&0x8000);if(read_pad)for(DWORD i=0;i<4&&!down;i++){XINPUT_STATE state={0};if(read_pad(i,&state)==ERROR_SUCCESS){unsigned buttons=state.Gamepad.wButtons;if(state.Gamepad.bLeftTrigger>166)buttons|=0x10000;if(state.Gamepad.bRightTrigger>166)buttons|=0x20000;down=(buttons&button_pair[0])&&(buttons&button_pair[1]);}}if(!down)down=menu_sdl_chord(button_pair[0],button_pair[1]);HWND foreground=GetForegroundWindow();DWORD owner=0;GetWindowThreadProcessId(foreground,&owner);bool focused=owner==GetCurrentProcessId()||(menu_paused&&foreground==menu_window);if(focused&&down&&!combo_held){menu_paused=!menu_paused;if(menu_paused)AllowSetForegroundWindow(host_pid);menu_event(menu_paused,foreground);}combo_held=down;}
static void video_forward(const void*data,unsigned w,unsigned h,size_t pitch){last_width=w;last_height=h;last_pitch=pitch;if(video_cb)video_cb(data,w,h,pitch);}
static int16_t input_forward(unsigned port,unsigned device,unsigned index,unsigned id){return menu_paused||combo_held?0:input_cb?input_cb(port,device,index,id):0;}
static bool state_file(const char*file,bool load){
 bool ok=false;void*data=NULL;FILE*f=NULL;const uint64_t limit=512ull*1024*1024;uint64_t size=0;char magic[8],tmp[32768];const char*expected="KALIWST1";
 if(load){f=utfopen(file,L"rb");if(!f)return false;if(fread(magic,1,8,f)!=8||memcmp(magic,expected,8)||fread(&size,8,1,f)!=1||!size||size>limit)goto done;if(_fseeki64(f,0,SEEK_END)||_ftelli64(f)!=(__int64)(16+size)||_fseeki64(f,16,SEEK_SET))goto done;data=malloc((size_t)size);if(!data||fread(data,1,(size_t)size,f)!=size)goto done;bool(*restore)(const void*,size_t)=symbol("retro_unserialize");ok=restore&&restore(data,(size_t)size);
 }else{size_t(*length)(void)=symbol("retro_serialize_size");bool(*save)(void*,size_t)=symbol("retro_serialize");size=length?length():0;if(!save||!size||size>limit)return false;data=calloc(1,(size_t)size);if(!data||!save(data,(size_t)size))goto done;snprintf(tmp,sizeof(tmp),"%s.tmp",file);f=utfopen(tmp,L"wb");if(!f)goto done;if(fwrite(expected,1,8,f)!=8||fwrite(&size,8,1,f)!=1||fwrite(data,1,(size_t)size,f)!=size)goto done;ok=!fflush(f);if(fclose(f))ok=false;f=NULL;if(ok){wchar_t a[32768],b[32768];MultiByteToWideChar(CP_UTF8,0,tmp,-1,a,32768);MultiByteToWideChar(CP_UTF8,0,file,-1,b,32768);ok=MoveFileExW(a,b,MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH)!=0;}}
 done:if(f)fclose(f);free(data);return ok;
}
