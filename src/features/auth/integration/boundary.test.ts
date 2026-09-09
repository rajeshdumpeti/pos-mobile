import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(__dirname, '../../../..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
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
test('integration has no AsyncStorage, logging, token decoding or live workflow hook', () => {
  const text = fs
    .readdirSync(__dirname, { recursive: true })
    .filter((x) => typeof x === 'string' && /\.tsx?$/.test(x) && !/\.test\./.test(x))
    .map((x) => fs.readFileSync(path.join(__dirname, x as string), 'utf8'))
    .join('\n');
  expect(text).not.toMatch(/AsyncStorage|console\.|jwt|atob|useMutation|persistQueryClient/);
});
