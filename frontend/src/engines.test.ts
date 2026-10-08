import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('package.json yêu cầu Node ≥ 22.22 và Node đang chạy đáp ứng', () => {
  const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));
  expect(pkg.engines?.node).toBe('>=22.22');
  const [major, minor] = process.versions.node.split('.').map(Number);
  expect(major > 22 || (major === 22 && minor >= 22)).toBe(true);
});
