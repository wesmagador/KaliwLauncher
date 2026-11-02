#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <xinput.h>
#include "../../native/libretro.h"
static char ipc[32768];static bool keys[256],focused=true;static XINPUT_GAMEPAD test_pad;static unsigned pad_slot;
static short key_state(int key){return keys[key]?(short)0x8000:0;}
static HWND fake_foreground(void){return (HWND)(uintptr_t)1;}
static DWORD foreground_owner(HWND window,LPDWORD owner){*owner=focused?GetCurrentProcessId():0;return 0;}
static DWORD WINAPI pad_state(DWORD slot,XINPUT_STATE*out){if(slot!=pad_slot)return ERROR_DEVICE_NOT_CONNECTED;memset(out,0,sizeof(*out));out->Gamepad=test_pad;return 0;}
static unsigned char ram[32];static size_t state_size(void){return sizeof(ram);}static bool save_ram(void*data,size_t size){if(size!=sizeof(ram))return false;memcpy(data,ram,size);return true;}static bool load_ram(const void*data,size_t size){if(size!=sizeof(ram))return false;memcpy(ram,data,size);return true;}
static void*symbol(const char*name){if(!strcmp(name,"retro_serialize_size"))return state_size;if(!strcmp(name,"retro_serialize"))return save_ram;if(!strcmp(name,"retro_unserialize"))return load_ram;return NULL;}
static FILE*utfopen(const char*file,const wchar_t*mode){wchar_t w[32768];MultiByteToWideChar(CP_UTF8,0,file,-1,w,32768);return _wfopen(w,mode);}
#define GetAsyncKeyState key_state
#define GetForegroundWindow fake_foreground
#define GetWindowThreadProcessId foreground_owner
#include "../../native/quick-menu.h"
int main(int argc,char**argv){assert(argc==2);snprintf(ipc,sizeof(ipc),"%s",argv[1]);read_pad=pad_state;keys[163]=true;poll_menu_hotkey();assert(!menu_paused);keys[13]=true;poll_menu_hotkey();assert(menu_paused&&event_counter==1);poll_menu_hotkey();assert(menu_paused&&event_counter==1);keys[13]=keys[163]=false;poll_menu_hotkey();keys[13]=keys[163]=true;poll_menu_hotkey();assert(!menu_paused&&event_counter==2);keys[13]=keys[163]=false;poll_menu_hotkey();focused=false;keys[13]=keys[163]=true;poll_menu_hotkey();assert(!menu_paused&&event_counter==2);focused=true;poll_menu_hotkey();assert(!menu_paused);keys[13]=keys[163]=false;poll_menu_hotkey();menu_bindings("161,80;256,512");test_pad.wButtons=256;poll_menu_hotkey();assert(!menu_paused);test_pad.wButtons|=512;poll_menu_hotkey();assert(menu_paused&&event_counter==3);test_pad.wButtons=0;poll_menu_hotkey();test_pad.wButtons=48;poll_menu_hotkey();assert(menu_paused&&event_counter==3);test_pad.wButtons=0;poll_menu_hotkey();menu_paused=false;menu_bindings("161,80;65536,131072");pad_slot=3;test_pad.bLeftTrigger=200;poll_menu_hotkey();assert(!menu_paused);test_pad.bRightTrigger=200;poll_menu_hotkey();assert(menu_paused&&event_counter==4);test_pad.bLeftTrigger=test_pad.bRightTrigger=0;poll_menu_hotkey();menu_paused=false;keys[161]=keys[80]=true;poll_menu_hotkey();assert(menu_paused&&event_counter==5);char file[32768];snprintf(file,sizeof(file),"%s/unit.kstate",ipc);ram[0]=42;assert(state_file(file,false));ram[0]=99;assert(state_file(file,true)&&ram[0]==42);FILE*f=utfopen(file,L"wb");fputs("KALIWST1",f);fclose(f);ram[0]=99;assert(!state_file(file,true)&&ram[0]==99);puts("Native shortcut transitions, two-button latch, focus isolation, live remap, player-4 triggers, save/load and truncated-state rejection passed.");return 0;}
