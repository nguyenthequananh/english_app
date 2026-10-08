// Khởi động jar thật trên thư mục dữ liệu tạm, cổng 8775, cho Playwright.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

if (!process.env.JAVA_HOME) {
  console.error('JAVA_HOME chưa được đặt: cần JDK 21 để chạy jar (không dùng java trên PATH).');
  process.exit(1);
}
// Playwright kết thúc server bằng kill cưỡng bức trên Windows nên không dọn được lúc thoát:
// dùng một thư mục cố định và xoá sạch dữ liệu cũ mỗi lần khởi động (không tích tụ thư mục tạm).
const home = join(tmpdir(), 'ielts-e2e');
rmSync(home, { recursive: true, force: true });
mkdirSync(home, { recursive: true });
writeFileSync(join(home, 'config.yml'), 'port: 8775\n');
const java = join(process.env.JAVA_HOME, 'bin', 'java');
const jar = resolve('..', 'backend', 'target', 'ielts-app-0.1.0.jar');
const child = spawn(java, [`-Dapp.home=${home}`, '-jar', jar, '--app.open-browser=false'], { stdio: 'inherit' });

const stop = () => {
  if (!child.killed) child.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
const cleanup = () => {
  try {
    rmSync(home, { recursive: true, force: true });
  } catch {
    // DB có thể còn bị khoá một lúc trên Windows: thử lại một lần.
    setTimeout(() => {
      try {
        rmSync(home, { recursive: true, force: true });
      } catch {
        /* bỏ qua */
      }
      process.exit(process.exitCode ?? 0);
    }, 500);
    return false;
  }
  return true;
};
child.on('error', (err) => {
  console.error('Không khởi động được jar:', err.message);
  process.exit(1);
});
child.on('exit', (code) => {
  process.exitCode = code ?? 0;
  if (cleanup()) process.exit(process.exitCode);
});
