import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const app = readJson('app.json').expo;
const eas = readJson('eas.json');
const pkg = readJson('package.json');
const failures = [];
const requireCheck = (condition, message) => {
  if (!condition) failures.push(message);
};

requireCheck(app.scheme === 'pos', 'Expo scheme must be pos.');
requireCheck(
  typeof pkg.dependencies?.['expo-dev-client'] === 'string',
  'expo-dev-client is required.',
);
requireCheck(
  eas.build?.development?.developmentClient === true &&
    eas.build?.development?.distribution === 'internal',
  'Physical-device development profile must be an internal development client.',
);
requireCheck(
  eas.build?.['development-simulator']?.developmentClient === true &&
    eas.build?.['development-simulator']?.ios?.simulator === true,
  'iOS Simulator profile must be an explicit development client simulator build.',
);
requireCheck(!eas.submit, 'Acceptance readiness must not configure submission profiles.');
requireCheck(!app.ios?.associatedDomains, 'Production associated domains are not approved.');
requireCheck(!app.android?.intentFilters, 'Production Android App Links are not approved.');
requireCheck(
  !fs.existsSync(path.join(root, 'ios')),
  'A native ios directory must not be generated.',
);
requireCheck(
  !fs.existsSync(path.join(root, 'android')),
  'A native android directory must not be generated.',
);
requireCheck(
  fs.existsSync(path.join(root, 'app/(auth)/reset-password.tsx')) &&
    fs.existsSync(path.join(root, 'src/features/auth/integration/PasswordResetLinkIngress.tsx')),
  'Password-reset route and centralized ingress are required.',
);
requireCheck(
  fs
    .readFileSync(path.join(root, 'src/api/client/apiConfig.ts'), 'utf8')
    .includes('EXPO_PUBLIC_API_BASE_URL'),
  'Public API origin must remain environment-driven.',
);
requireCheck(
  fs.readFileSync(path.join(root, '.env.example'), 'utf8').includes('EXPO_PUBLIC_API_BASE_URL='),
  'The public API variable name must be documented.',
);

if (failures.length) {
  for (const failure of failures) process.stderr.write(`FAIL: ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Repository-owned Authentication acceptance prerequisites are ready.\n');
  process.stdout.write(
    'External accounts, services, devices, builds, and acceptance remain unverified.\n',
  );
}
