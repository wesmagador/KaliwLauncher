#include "../../native/disc-bridge.c"
#include <assert.h>
static unsigned held[4],polls;
static void test_poll(void){polls++;}
static int16_t test_input(unsigned port,unsigned device,unsigned index,unsigned id){return port<4&&device==RETRO_DEVICE_JOYPAD&&id<16?!!(held[port]&(1u<<id)):0;}
int main(void){input_cb=test_input;menu_input_poll=test_poll;assert(!menu_sdl_chord(0x10,0x20));held[0]=(1u<<2)|(1u<<3);assert(menu_sdl_chord(0x10,0x20));held[0]=1u<<3;assert(!menu_sdl_chord(0x10,0x20));held[0]=0;held[3]=(1u<<10)|(1u<<11);assert(menu_sdl_chord(0x100,0x200));held[3]=(1u<<12)|(1u<<13);assert(menu_sdl_chord(0x10000,0x20000));assert(polls==5);assert(!GetModuleHandleW(L"SDL2.dll"));puts("Frontend-owned controller chords: select/start, remap, triggers, four ports, release and polling passed; no extra SDL instance.");return 0;}
