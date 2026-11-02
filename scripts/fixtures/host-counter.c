#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
static const wchar_t*file;static unsigned counter;
static LRESULT CALLBACK procedure(HWND w,UINT m,WPARAM a,LPARAM b){if(m==WM_TIMER){FILE*f=_wfopen(file,L"wb");if(f){fprintf(f,"%u",++counter);fclose(f);}return 0;}if(m==WM_CLOSE){DestroyWindow(w);return 0;}if(m==WM_DESTROY){PostQuitMessage(0);return 0;}return DefWindowProcW(w,m,a,b);}
int wmain(int argc,wchar_t**argv){if(argc!=2)return 2;file=argv[1];WNDCLASSW c={.lpfnWndProc=procedure,.hInstance=GetModuleHandleW(NULL),.lpszClassName=L"KaliwOwnedHostTest"};RegisterClassW(&c);HWND w=CreateWindowW(c.lpszClassName,L"Kaliw owned test",WS_OVERLAPPEDWINDOW,0,0,100,100,NULL,NULL,c.hInstance,NULL);SetTimer(w,1,20,NULL);MSG msg;while(GetMessageW(&msg,NULL,0,0)>0){TranslateMessage(&msg);DispatchMessageW(&msg);}return 0;}
