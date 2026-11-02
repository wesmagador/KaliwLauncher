#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include "../../native/libretro.h"
int wmain(int argc,wchar_t**argv){if(argc!=2)return 2;HMODULE dll=LoadLibraryW(argv[1]);if(!dll){printf("LOAD_ERROR %lu\n",GetLastError());return 3;}void(*info)(struct retro_system_info*)=(void*)GetProcAddress(dll,"retro_get_system_info");if(!info)return 4;struct retro_system_info s={0};info(&s);printf("%s\n%s\n%s\n",s.library_name,s.library_version,s.valid_extensions);return 0;}
