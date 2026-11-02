// MIT. SDL controller polling for native menu chords (USB / Bluetooth / XInput).
static HMODULE menu_sdl;
static void* menu_pads[4];
static int (*sdl_count)(void),(*sdl_is_pad)(int),(*sdl_attached)(void*);
static void* (*sdl_open)(int);
static void (*sdl_close)(void*),(*sdl_update)(void),(*sdl_pump)(void);
static unsigned char (*sdl_button)(void*,int);
static short (*sdl_axis)(void*,int);
static void menu_sdl_init(void){if(GetEnvironmentVariableW(L"KALIW_NO_SDL_MENU",NULL,0))return;wchar_t file[32768];if(!GetEnvironmentVariableW(L"KALIW_SDL",file,32768))return;menu_sdl=LoadLibraryExW(file,NULL,LOAD_WITH_ALTERED_SEARCH_PATH);if(!menu_sdl)return;
#define SDL_FN(target,name) target=(void*)GetProcAddress(menu_sdl,name)
int(*init)(unsigned);int(*hint)(const char*,const char*);int(*events)(int);SDL_FN(init,"SDL_InitSubSystem");SDL_FN(hint,"SDL_SetHint");SDL_FN(events,"SDL_GameControllerEventState");SDL_FN(sdl_count,"SDL_NumJoysticks");SDL_FN(sdl_is_pad,"SDL_IsGameController");SDL_FN(sdl_attached,"SDL_GameControllerGetAttached");SDL_FN(sdl_open,"SDL_GameControllerOpen");SDL_FN(sdl_close,"SDL_GameControllerClose");SDL_FN(sdl_update,"SDL_GameControllerUpdate");SDL_FN(sdl_pump,"SDL_PumpEvents");SDL_FN(sdl_button,"SDL_GameControllerGetButton");SDL_FN(sdl_axis,"SDL_GameControllerGetAxis");if(!init||!hint||!events||!sdl_count||!sdl_is_pad||!sdl_attached||!sdl_open||!sdl_close||!sdl_update||!sdl_pump||!sdl_button||!sdl_axis){sdl_count=NULL;return;}hint("SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS","1");hint("SDL_JOYSTICK_HIDAPI_PS5","1");if(init(0x2000)){sdl_count=NULL;return;}/* Do not disable events here: RetroArch may share this SDL instance. */
#undef SDL_FN
}
static bool menu_sdl_chord(unsigned a,unsigned b){if(!sdl_count)return false;sdl_pump();sdl_update();int count=sdl_count();for(int i=0;i<4;i++){if(menu_pads[i]&&!sdl_attached(menu_pads[i])){sdl_close(menu_pads[i]);menu_pads[i]=NULL;}if(!menu_pads[i]&&i<count&&sdl_is_pad(i))menu_pads[i]=sdl_open(i);void*p=menu_pads[i];if(!p)continue;static const unsigned masks[]={0x1000,0x2000,0x4000,0x8000,0x20,0,0x10,0x40,0x80,0x100,0x200,1,2,4,8};unsigned pressed=0;for(int j=0;j<15;j++)if(sdl_button(p,j))pressed|=masks[j];if(sdl_axis(p,4)>21299)pressed|=0x10000;if(sdl_axis(p,5)>21299)pressed|=0x20000;if((pressed&a)&&(pressed&b))return true;}return false;}
static void menu_sdl_shutdown(void){for(int i=0;i<4;i++)if(menu_pads[i]){sdl_close(menu_pads[i]);menu_pads[i]=NULL;}if(menu_sdl&&sdl_count){void(*quit)(unsigned)=(void*)GetProcAddress(menu_sdl,"SDL_QuitSubSystem");if(quit)quit(0x2000);sdl_count=NULL;}}
