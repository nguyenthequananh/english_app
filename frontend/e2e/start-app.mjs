// Khởi động jar thật trên thư mục dữ liệu tạm, cổng 8775, cho Playwright.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const home = mkdtempSync(join(tmpdir(), 'ielts-e2e-'));
writeFileSync(join(home, 'config.yml'), 'port: 8775\n');
const java = join(process.env.JAVA_HOME ?? '', 'bin', 'java');
const jar = resolve('..', 'backend', 'target', 'ielts-app-0.1.0.jar');
const child = spawn(java, [`-Dapp.home=${home}`, '-jar', jar, '--app.open-browser=false'], { stdio: 'inherit' });

const stop = () => {
  if (!child.killed) child.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
child.on('exit', (code) => process.exit(code ?? 0));
