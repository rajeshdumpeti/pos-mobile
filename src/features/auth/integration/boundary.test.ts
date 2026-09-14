import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(__dirname, '../../../..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const sources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory()
      ? sources(file)
      : /\.tsx?$/.test(file) && !/\.test\./.test(file)
        ? [file]
        : [];
  });
test('credential dependencies stay out of screens navigation design system and session context', () => {
  for (const p of ['src/features/auth/screens', 'src/navigation', 'src/design-system']) {
    const text = fs
      .readdirSync(path.join(root, p), { recursive: true })
      .filter((x) => typeof x === 'string' && /\.tsx?$/.test(x) && !/\.test\./.test(x))
      .map((x) => read(path.join(p, x as string)))
      .join('\n');
    expect(text).not.toMatch(/expo-secure-store|SecureStore/);
  }
  expect(read('src/features/auth/session/sessionState.ts')).not.toMatch(
    /access.?token|refresh.?token|credential/i,
  );
});
test('integration has no AsyncStorage, logging, token decoding or persisted query state', () => {
  const text = fs
    .readdirSync(__dirname, { recursive: true })
    .filter((x) => typeof x === 'string' && /\.tsx?$/.test(x) && !/\.test\./.test(x))
    .map((x) => fs.readFileSync(path.join(__dirname, x as string), 'utf8'))
    .join('\n');
  expect(text).not.toMatch(/AsyncStorage|console\.|jwt|atob|persistQueryClient/);
  for (const file of sources(path.join(__dirname))) {
    if (/use(?:Registration|Verification)\.tsx?$/.test(file)) continue;
    expect(fs.readFileSync(file, 'utf8')).not.toMatch(/useMutation|useQuery/);
  }
});
