#!/usr/bin/env bash
# Tạo bộ cài Windows: dist/IELTS-App-Setup-0.1.0.exe (cần JAVA_HOME = JDK 21 và Inno Setup 6).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=0.1.0

ISCC="${ISCC:-}"
if [ -z "$ISCC" ]; then
  for candidate in "${LOCALAPPDATA:-}/Programs/Inno Setup 6/ISCC.exe" \
                   "/c/Program Files (x86)/Inno Setup 6/ISCC.exe" \
                   "/c/Program Files/Inno Setup 6/ISCC.exe"; do
    if [ -f "$candidate" ]; then ISCC="$candidate"; break; fi
  done
fi
if [ -z "$ISCC" ] || [ ! -f "$ISCC" ]; then
  echo "Không tìm thấy Inno Setup 6 (ISCC.exe). Cài: winget install JRSoftware.InnoSetup" >&2
  exit 1
fi

bash "$ROOT/packaging/build-portable.sh"
"$ISCC" -Qp "-DAppVersion=$VERSION" "$(cygpath -w "$ROOT/packaging/installer.iss")"
echo "Xong: $ROOT/dist/IELTS-App-Setup-${VERSION}.exe"
