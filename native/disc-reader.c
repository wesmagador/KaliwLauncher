// Read-only Windows optical disc preparation. MIT. Never writes to the drive.
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winioctl.h>
#include <ntddcdrm.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <wchar.h>
#include <string.h>
static void jsonstr(const wchar_t*w){char b[4096];WideCharToMultiByte(CP_UTF8,0,w,-1,b,sizeof(b),NULL,NULL);putchar('"');for(unsigned char*p=(unsigned char*)b;*p;p++){if(*p=='"'||*p=='\\')putchar('\\');if(*p>=32)putchar(*p);}putchar('"');}
static int fail(const char*m){fprintf(stderr,"%s (Windows %lu)\n",m,GetLastError());return 1;}
static int lba(const UCHAR*a){return ((int)a[1]*60+(int)a[2])*75+(int)a[3]-150;}
static int rawread(HANDLE h,unsigned sector,unsigned count,void*buf,int mode){RAW_READ_INFO info;memset(&info,0,sizeof(info));info.DiskOffset.QuadPart=(LONGLONG)sector*2048;info.SectorCount=count;info.TrackMode=(TRACK_MODE_TYPE)mode;DWORD got=0;return DeviceIoControl(h,IOCTL_CDROM_RAW_READ,&info,sizeof(info),buf,count*2352,&got,NULL)&&got==count*2352;}
static void progress(unsigned n,unsigned total){printf("{\"percent\":%u,\"received\":%u,\"total\":%u}\n",(unsigned)((uint64_t)n*100/total),n,total);fflush(stdout);}
static BOOL CALLBACK focus_window(HWND window,LPARAM pid){DWORD owner=0;GetWindowThreadProcessId(window,&owner);if(owner==(DWORD)pid&&IsWindowVisible(window)&&GetWindow(window,GW_OWNER)==NULL){ShowWindow(window,SW_RESTORE);SetForegroundWindow(window);return FALSE;}return TRUE;}
int wmain(int argc,wchar_t**argv){
 if(argc==3&&!wcscmp(argv[1],L"--focus")){EnumWindows(focus_window,(LPARAM)wcstoul(argv[2],NULL,10));return 0;}
 if(argc==2&&!wcscmp(argv[1],L"--list")){DWORD mask=GetLogicalDrives();int first=1;putchar('[');for(unsigned i=0;i<26;i++)if(mask&(1u<<i)){wchar_t root[]={L'A'+i,L':',L'\\',0};if(GetDriveTypeW(root)!=DRIVE_CDROM)continue;wchar_t label[256]={0};DWORD serial=0;BOOL ready=GetVolumeInformationW(root,label,256,&serial,NULL,NULL,NULL,0);if(!first)putchar(',');first=0;printf("{\"drive\":\"%c:\",\"ready\":%s,\"label\":",'A'+i,ready?"true":"false");jsonstr(label);printf(",\"serial\":%lu}",serial);}puts("]");return 0;}
 if(argc!=3||wcslen(argv[1])!=2||argv[1][1]!=L':'||argv[1][0]<L'A'||argv[1][0]>L'Z')return fail("Invalid optical drive");
 wchar_t root[]={argv[1][0],L':',L'\\',0};if(GetDriveTypeW(root)!=DRIVE_CDROM)return fail("Not an optical drive");
 wchar_t device[]={L'\\',L'\\',L'.',L'\\',argv[1][0],L':',0};HANDLE h=CreateFileW(device,GENERIC_READ,FILE_SHARE_READ|FILE_SHARE_WRITE,NULL,OPEN_EXISTING,0,NULL);if(h==INVALID_HANDLE_VALUE)return fail("Cannot open the optical drive for reading");
 unsigned char*buf=malloc(1024*1024);if(!buf){CloseHandle(h);return fail("Out of memory");}CDROM_TOC toc;DWORD got=0;memset(&toc,0,sizeof(toc));int has_toc=DeviceIoControl(h,IOCTL_CDROM_READ_TOC,NULL,0,&toc,sizeof(toc),&got,NULL);int count=has_toc?(int)toc.LastTrack-(int)toc.FirstTrack+1:0;int raw_mode=-1;int raw=0;
 if(count>0&&count<=99&&got>=(DWORD)(4+(count+1)*8)){for(int mode=2;mode>=0;mode--)if(rawread(h,0,1,buf,mode)){raw=1;raw_mode=mode;break;}}
 unsigned total=0;wchar_t out[32768];FILE*f=NULL;
 if(raw){int end=lba(toc.TrackData[count].Address);if(end<=0||end>500000){free(buf);CloseHandle(h);return fail("Invalid CD table of contents");}total=end;swprintf(out,32768,L"%ls/disc.bin",argv[2]);f=_wfopen(out,L"wb");if(!f){free(buf);CloseHandle(h);return fail("Cannot create temporary CD image");}
 for(unsigned n=0;n<total;){unsigned batch=total-n<16?total-n:16;int ok=rawread(h,n,batch,buf,raw_mode);if(!ok){batch=1;for(int mode=2;mode>=0&&!ok;mode--)if(rawread(h,n,1,buf,mode)){ok=1;raw_mode=mode;}}if(!ok||fwrite(buf,2352,batch,f)!=batch){fclose(f);free(buf);CloseHandle(h);return fail("Could not read every sector of the CD");}n+=batch;if(n%256<16||n==total)progress(n,total);}if(fclose(f)){free(buf);CloseHandle(h);return fail("Could not save temporary CD image");}
 swprintf(out,32768,L"%ls/disc.cue",argv[2]);f=_wfopen(out,L"wb");if(!f){free(buf);CloseHandle(h);return fail("Cannot create temporary CUE");}fprintf(f,"FILE \"disc.bin\" BINARY\n");for(int i=0;i<count;i++){int start=lba(toc.TrackData[i].Address);if(start<0||start>=(int)total){fclose(f);free(buf);CloseHandle(h);return fail("Unsupported CD track layout");}const char*mode="AUDIO";if(toc.TrackData[i].Control&4){if(!rawread(h,start,1,buf,raw_mode)){fclose(f);free(buf);CloseHandle(h);return fail("Could not identify CD data track");}mode=buf[15]==2?"MODE2/2352":"MODE1/2352";}fprintf(f,"  TRACK %02u %s\n    INDEX 01 %02u:%02u:%02u\n",i+1,mode,start/4500,(start/75)%60,start%75);}if(fclose(f)){free(buf);CloseHandle(h);return fail("Cannot save CUE");}puts("{\"done\":true,\"format\":\"cue\"}");
 }else{LARGE_INTEGER off;off.QuadPart=16*2048;if(!SetFilePointerEx(h,off,NULL,FILE_BEGIN)||!ReadFile(h,buf,2048,&got,NULL)||got!=2048||buf[0]!=1||memcmp(buf+1,"CD001",5)){free(buf);CloseHandle(h);return fail("No readable ISO 9660 DVD or supported raw CD");}total=(unsigned)buf[80]|(unsigned)buf[81]<<8|(unsigned)buf[82]<<16|(unsigned)buf[83]<<24;if(total<17||total>5000000){free(buf);CloseHandle(h);return fail("Invalid DVD size");}off.QuadPart=0;if(!SetFilePointerEx(h,off,NULL,FILE_BEGIN)){free(buf);CloseHandle(h);return fail("Cannot seek DVD");}swprintf(out,32768,L"%ls/disc.iso",argv[2]);f=_wfopen(out,L"wb");if(!f){free(buf);CloseHandle(h);return fail("Cannot create temporary DVD image");}for(unsigned n=0;n<total;){unsigned batch=total-n<256?total-n:256,bytes=batch*2048;if(!ReadFile(h,buf,bytes,&got,NULL)||got!=bytes||fwrite(buf,1,bytes,f)!=bytes){fclose(f);free(buf);CloseHandle(h);return fail("Could not read every sector of the DVD");}n+=batch;progress(n,total);}if(fclose(f)){free(buf);CloseHandle(h);return fail("Cannot save temporary DVD image");}puts("{\"done\":true,\"format\":\"iso\"}");}
 free(buf);CloseHandle(h);return 0;
}
