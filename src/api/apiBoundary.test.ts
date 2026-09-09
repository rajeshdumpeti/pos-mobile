import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(__dirname, '../..');
function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? sources(p) : /\.tsx?$/.test(p) && !/\.test\./.test(p) ? [p] : [];
  });
}
test('API layer does not depend on feature or UI code', () => {
  const api = sources(__dirname)
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n');
  expect(api).not.toMatch(/features\/auth|screens|react-query|AsyncStorage|console\./);
});
test('screens never call fetch or import generated contracts', () => {
  const screens = sources(path.join(root, 'src/features/auth/screens'))
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n');
  expect(screens).not.toMatch(/\bfetch\s*\(|api\/generated/);
});
