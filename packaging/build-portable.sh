#!/usr/bin/env bash
# Tạo bản portable Windows: dist/IELTS-App-0.1.0-portable.zip (cần JAVA_HOME = JDK 21).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${JAVA_HOME:?Cần đặt JAVA_HOME trỏ tới JDK 21}"
VERSION=0.1.0
JAR="ielts-app-${VERSION}.jar"
OUT="$ROOT/dist"
APP_NAME="IELTS App"
MODULES="java.base,java.compiler,java.desktop,java.instrument,java.logging,java.management,java.naming,java.net.http,java.prefs,java.rmi,java.scripting,java.security.jgss,java.sql,java.xml,jdk.crypto.ec,jdk.unsupported,jdk.zipfs"

rm -rf "$OUT"
mkdir -p "$OUT/input"

(cd "$ROOT/backend" && ./mvnw -q -Papp clean package -DskipTests)
cp "$ROOT/backend/target/$JAR" "$OUT/input/"

"$JAVA_HOME/bin/jlink" --add-modules "$MODULES" --strip-debug --no-header-files --no-man-pages \
  --compress zip-6 --output "$OUT/runtime"

"$JAVA_HOME/bin/jpackage" --type app-image --name "$APP_NAME" --app-version "$VERSION" \
  --vendor "IELTS App" --input "$OUT/input" --main-jar "$JAR" \
  --main-class org.springframework.boot.loader.launch.JarLauncher \
  --runtime-image "$OUT/runtime" \
  --java-options "-Xms64m -Xmx256m -XX:+UseSerialGC -Dfile.encoding=UTF-8" \
  --dest "$OUT"

powershell.exe -NoProfile -Command \
  "\$ErrorActionPreference='Stop'; Compress-Archive -Path '$(cygpath -w "$OUT/$APP_NAME")' -DestinationPath '$(cygpath -w "$OUT/IELTS-App-${VERSION}-portable.zip")' -Force"

rm -rf "$OUT/input" "$OUT/runtime"
echo "Xong: $OUT/IELTS-App-${VERSION}-portable.zip"
