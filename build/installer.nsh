!ifndef BUILD_UNINSTALLER
!include MUI2.nsh
!include nsDialogs.nsh
!include LogicLib.nsh
!include FileFunc.nsh
Var KaliwDataRoot
Var KaliwDataInput
Var KaliwDataDialog

!macro customPageAfterChangeDir
 Page custom KaliwDataPage KaliwDataLeave
!macroend

Function KaliwDataPage
 !insertmacro MUI_HEADER_TEXT "Pasta de dados do Kaliw" "Escolha onde guardar BIOS, jogos, saves e configurações."
 nsDialogs::Create 1018
 Pop $KaliwDataDialog
 ${NSD_CreateLabel} 0 0 100% 38u "Escolha uma pasta exclusiva para os dados do Kaliw. O instalador criará BIOS e Jogos separados por emulador."
 Pop $0
 ${If} $KaliwDataRoot == ""
  ReadINIStr $KaliwDataRoot "$INSTDIR\kaliw-storage.ini" "Storage" "Root"
  ${If} $KaliwDataRoot == ""
   StrCpy $KaliwDataRoot "$DOCUMENTS\KaliwLauncher-Dados"
  ${EndIf}
 ${EndIf}
 ${NSD_CreateDirRequest} 0 47u 78% 14u "$KaliwDataRoot"
 Pop $KaliwDataInput
 ${NSD_CreateBrowseButton} 80% 46u 20% 16u "Procurar..."
 Pop $0
 ${NSD_OnClick} $0 KaliwBrowseData
 ${NSD_CreateLabel} 0 76u 100% 42u "Use uma pasta vazia ou uma pasta de dados já criada por este instalador. Reinstalar não apaga jogos, BIOS ou saves. Dados de versões portáteis não são migrados automaticamente."
 Pop $0
 nsDialogs::Show
FunctionEnd

Function KaliwBrowseData
 nsDialogs::SelectFolderDialog "Escolha uma pasta nova para os dados" "$DOCUMENTS"
 Pop $0
 ${If} $0 != error
  ${NSD_SetText} $KaliwDataInput "$0"
 ${EndIf}
FunctionEnd

Function KaliwValidateData
 ${If} $KaliwDataRoot == ""
  MessageBox MB_ICONSTOP "Escolha a pasta de dados." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 System::Call 'kernel32::GetFullPathNameW(w "$KaliwDataRoot", i ${NSIS_MAX_STRLEN}, w .r0, p 0)i.r1'
 ${If} $1 == 0
 ${OrIf} $1 >= ${NSIS_MAX_STRLEN}
  MessageBox MB_ICONSTOP "O caminho escolhido é inválido ou muito longo." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 StrCpy $KaliwDataRoot $0
 System::Call 'kernel32::GetFullPathNameW(w "$INSTDIR", i ${NSIS_MAX_STRLEN}, w .r2, p 0)i.r3'
 ${If} $3 == 0
 ${OrIf} $3 >= ${NSIS_MAX_STRLEN}
  MessageBox MB_ICONSTOP "A pasta do programa é inválida ou muito longa." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 StrCpy $INSTDIR $2
 ${GetRoot} "$KaliwDataRoot" $0
 ${If} $KaliwDataRoot == $0
  MessageBox MB_ICONSTOP "Use uma pasta exclusiva, não a raiz de uma unidade." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 ${If} $KaliwDataRoot == "$0\"
  MessageBox MB_ICONSTOP "Use uma pasta exclusiva, não a raiz de uma unidade." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 ${If} $KaliwDataRoot == "$INSTDIR"
  MessageBox MB_ICONSTOP "Escolha uma pasta de dados separada da pasta do programa." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 StrLen $0 "$INSTDIR\"
 StrCpy $1 "$KaliwDataRoot\" $0
 ${If} $1 == "$INSTDIR\"
  MessageBox MB_ICONSTOP "Os dados devem ficar fora da pasta do programa." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 StrLen $0 "$KaliwDataRoot\"
 StrCpy $1 "$INSTDIR\" $0
 ${If} $1 == "$KaliwDataRoot\"
  MessageBox MB_ICONSTOP "A pasta do programa deve ficar fora da pasta de dados." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 ReadINIStr $0 "$KaliwDataRoot\kaliw-data.ini" "Kaliw" "Owner"
 ${If} $0 == "com.kaliw.launcher"
  Return
 ${EndIf}
 ClearErrors
 StrCpy $1 ""
 FindFirst $0 $1 "$KaliwDataRoot\*.*"
 IfErrors dataFolderReady
 loopData:
 ${If} $1 != ""
  ${If} $1 != "."
  ${AndIf} $1 != ".."
   FindClose $0
   MessageBox MB_ICONSTOP "Escolha uma pasta vazia ou uma pasta já criada pelo Kaliw." /SD IDOK
   SetErrorLevel 2
   Abort
  ${EndIf}
  FindNext $0 $1
  Goto loopData
 ${EndIf}
 FindClose $0
 dataFolderReady:
FunctionEnd

Function KaliwDataLeave
 ${NSD_GetText} $KaliwDataInput $KaliwDataRoot
 Call KaliwValidateData
FunctionEnd

!macro customInstall
 ${If} ${Silent}
  ${GetParameters} $0
  ${GetOptions} $0 "/DATA=" $KaliwDataRoot
  ${GetOptions} $0 "/TRACE=" $3
  ${If} $3 != ""
   FileOpen $2 "$INSTDIR\installer-data.log" w
   FileWrite $2 "Args=$0$\r$\nRoot=$KaliwDataRoot$\r$\n"
   FileClose $2
  ${EndIf}
  Call KaliwValidateData
 ${EndIf}
 ClearErrors
 CreateDirectory "$KaliwDataRoot\Sistema\Launcher"
 ${If} ${Errors}
  MessageBox MB_ICONSTOP "Não foi possível criar a pasta de dados escolhida. Verifique as permissões." /SD IDOK
  SetErrorLevel 2
  Abort
 ${EndIf}
 WriteINIStr "$KaliwDataRoot\kaliw-data.ini" "Kaliw" "Owner" "com.kaliw.launcher"
 FileOpen $0 "$INSTDIR\kaliw-storage.ini" w
 FileWriteUTF16LE /BOM $0 "[Storage]$\r$\nRoot=$KaliwDataRoot$\r$\n"
 FileClose $0
 !insertmacro KaliwConsole "ps1"
 !insertmacro KaliwConsole "ps2"
 !insertmacro KaliwConsole "gb"
 !insertmacro KaliwConsole "gba"
 !insertmacro KaliwConsole "sms"
 !insertmacro KaliwConsole "nes"
 !insertmacro KaliwConsole "n64"
 !insertmacro KaliwConsole "atari"
 !insertmacro KaliwConsole "mame"
 !insertmacro KaliwConsole "wii"
 !insertmacro KaliwConsole "wiiu"
 !insertmacro KaliwConsole "ps3"
 !insertmacro KaliwConsole "ps4"
 !insertmacro KaliwConsole "x360"
 !insertmacro KaliwConsole "switch"
 SetErrorLevel 0
!macroend

!macro KaliwConsole ID
 CreateDirectory "$KaliwDataRoot\Emuladores\${ID}\BIOS"
 CreateDirectory "$KaliwDataRoot\Emuladores\${ID}\Jogos"
!macroend
!endif
