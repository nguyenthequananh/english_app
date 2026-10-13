; Bộ cài Windows cho IELTS App (Inno Setup 6).
; Đóng gói thư mục app-image do build-portable.sh tạo ra (dist\IELTS App, đã kèm Java runtime).
; Build: bash packaging/build-installer.sh

#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif
#define AppName "IELTS App"
#define AppExe "IELTS App.exe"

[Setup]
; AppId cố định: cài bản mới sẽ cập nhật đè bản cũ.
AppId={{2667F8B1-AECC-456A-8066-7AEF149FD166}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=IELTS App
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
; Cài cho người dùng hiện tại, không cần quyền Admin.
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\dist
OutputBaseFilename=IELTS-App-Setup-{#AppVersion}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\{#AppExe}
UninstallDisplayName={#AppName}
CloseApplications=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
english.DesktopIcon=Tạo biểu tượng ngoài Desktop
english.LaunchApp=Mở IELTS App ngay

[Tasks]
Name: "desktopicon"; Description: "{cm:DesktopIcon}"

[Files]
Source: "..\dist\IELTS App\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "{cm:LaunchApp}"; Flags: nowait postinstall skipifsilent

; Gỡ cài đặt chỉ xoá chương trình; dữ liệu học ở %USERPROFILE%\.ielts-app được giữ lại.
