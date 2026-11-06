/* global process, console */
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const output = join(tmpdir(), `pos-openapi-${process.pid}.ts`);
try {
  execFileSync(
    process.execPath,
    [
      './node_modules/openapi-typescript/bin/cli.js',
      'src/api/contract/openapi.json',
      '--output',
      output,
    ],
    { stdio: 'inherit' },
  );
  execFileSync(
    process.execPath,
    ['./node_modules/prettier/bin/prettier.cjs', '--config', '.prettierrc', '--write', output],
    { stdio: 'inherit' },
  );
  if (readFileSync(output, 'utf8') !== readFileSync('src/api/generated/schema.ts', 'utf8'))
    throw new Error('Generated API types are stale. Run npm run api:generate.');
  console.log('Generated API types are current.');
} finally {
  rmSync(output, { force: true });
}
