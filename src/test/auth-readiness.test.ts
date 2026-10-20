import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const json = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('Expo and EAS own the required development-build foundation', () => {
  const app = json('app.json').expo;
  const eas = json('eas.json');
  const pkg = json('package.json');
  expect(app.scheme).toBe('pos');
  expect(pkg.dependencies['expo-dev-client']).toBe('57.0.20');
  expect(eas.build.development).toMatchObject({
    developmentClient: true,
    distribution: 'internal',
    environment: 'development',
  });
  expect(eas.build['development-simulator']).toMatchObject({
    developmentClient: true,
    distribution: 'internal',
    environment: 'development',
    ios: { simulator: true },
  });
  expect(eas.submit).toBeUndefined();
  expect(app.ios.associatedDomains).toBeUndefined();
  expect(app.android.intentFilters).toBeUndefined();
});

test('readiness remains environment-driven and creates no native projects', () => {
  const apiConfig = fs.readFileSync(path.join(root, 'src/api/client/apiConfig.ts'), 'utf8');
  expect(apiConfig).toContain('EXPO_PUBLIC_API_BASE_URL');
  expect(apiConfig).not.toMatch(/(?:api[_-]?key|password|secret)=/i);
  expect(fs.existsSync(path.join(root, 'ios'))).toBe(false);
  expect(fs.existsSync(path.join(root, 'android'))).toBe(false);
});

test('acceptance runbook contains every gate and sanitized ownership fields', () => {
  const runbook = fs.readFileSync(
    path.join(root, 'docs/authentication-acceptance-runbook.md'),
    'utf8',
  );
  for (let gate = 1; gate <= 15; gate += 1) expect(runbook).toContain(`Gate ${gate}`);
  expect(runbook).toContain('AUTH-XX — Short title');
  expect(runbook).toContain('frontend issue → `pos-mobile`');
  expect(runbook).toContain('backend issue → backend handoff');
  expect(runbook).not.toMatch(/Authorization:\s+Bearer\s+\S+/i);
});
