#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include "../../native/libretro.h"
static bool menu_paused,combo_held;
static int16_t input_forward(unsigned p,unsigned d,unsigned i,unsigned id){return 17;}
#include "../../native/wii-pointer.h"
_Static_assert(sizeof(struct kaliw_pointer_packet)==76,"Shared pointer ABI changed");
__declspec(dllexport) void test_init(void){pointer_init();}
__declspec(dllexport) int test_input(unsigned port,unsigned device,unsigned index,unsigned id){pointer_refresh();return wii_input_forward(port,device,index,id);}
__declspec(dllexport) void test_paused(int state){menu_paused=state!=0;}
__declspec(dllexport) void test_shutdown(void){pointer_shutdown();}
