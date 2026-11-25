import fs from 'node:fs';
import path from 'node:path';

import { performance } from 'node:perf_hooks';

import { parseVoiceInput } from './index';

const sourceFiles = fs
  .readdirSync(__dirname)
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  .map((name) => ({ name, source: fs.readFileSync(path.join(__dirname, name), 'utf8') }));

describe('parser purity', () => {
  it('has source files to check', () => {
    expect(sourceFiles.length).toBeGreaterThanOrEqual(10);
  });

  it('never reads the system clock or the device timezone', () => {
    for (const { name, source } of sourceFiles) {
      expect({ name, hit: /Date\.now\s*\(/.test(source) }).toEqual({ name, hit: false });
      expect({ name, hit: /new Date\(\s*\)/.test(source) }).toEqual({ name, hit: false });
      expect({
        name,
        hit: /performance\.now|getTimezoneOffset|resolvedOptions/.test(source),
      }).toEqual({
        name,
        hit: false,
      });
    }
  });

  it('never logs, stores or sends anything', () => {
    for (const { name, source } of sourceFiles) {
      expect({
        name,
        hit: /console\.|fetch\s*\(|XMLHttpRequest|AsyncStorage|SecureStore|localStorage|Math\.random/.test(
          source,
        ),
      }).toEqual({ name, hit: false });
    }
  });

  it('imports only from inside the parser folder', () => {
    for (const { name, source } of sourceFiles) {
      const specifiers = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1] ?? '');
      for (const specifier of specifiers) {
        expect({ name, specifier, local: specifier.startsWith('./') }).toEqual({
          name,
          specifier,
          local: true,
        });
      }
    }
  });
});

describe('parser performance', () => {
  type Golden = { text: string; input: { contextDate: string; timezone: string; now: string } };
  const golden = JSON.parse(
    fs.readFileSync(path.join(__dirname, '__golden__', 'cases.json'), 'utf8'),
  ) as Golden[];

  it('parses the whole golden set in under 2 ms on average and 20 ms at worst', () => {
    const timings: number[] = [];
    for (const { text, input } of golden) {
      const started = performance.now();
      parseVoiceInput({
        text,
        contextDate: input.contextDate,
        timezone: input.timezone,
        now: new Date(input.now),
      });
      timings.push(performance.now() - started);
    }
    const average = timings.reduce((sum, t) => sum + t, 0) / timings.length;
    const worst = Math.max(...timings);
    console.info(
      `parser timing over ${timings.length} cases: average ${average.toFixed(3)} ms, max ${worst.toFixed(3)} ms`,
    );
    expect(average).toBeLessThan(2);
    expect(worst).toBeLessThan(20);
  });
});
