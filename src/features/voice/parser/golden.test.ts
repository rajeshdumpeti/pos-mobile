import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { parseVoiceInput } from './index';
import type { ParseResult } from './types';

type GoldenCase = {
  id: string;
  category: string;
  text: string;
  input: { contextDate: string; timezone: string; now: string };
  expected: ParseResult;
};

const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, '__golden__', 'cases.json'), 'utf8'),
) as GoldenCase[];

const MINIMUM_PER_CATEGORY: Record<string, number> = {
  leadin: 30,
  reldate: 40,
  weekday: 30,
  absdate: 40,
  time: 40,
  baretime: 30,
  range: 25,
  duration: 25,
  priority: 20,
  unsupported: 30,
  multiple: 25,
  past: 15,
  passed: 15,
  dst: 10,
  title: 20,
  numwords: 25,
  tz: 15,
};

function run(testCase: GoldenCase): ParseResult {
  return parseVoiceInput({
    text: testCase.text,
    contextDate: testCase.input.contextDate,
    timezone: testCase.input.timezone,
    now: new Date(testCase.input.now),
  });
}

describe('golden set', () => {
  it('has at least 400 cases and the required minimum per category', () => {
    expect(cases.length).toBeGreaterThanOrEqual(400);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);

    const counts: Record<string, number> = {};
    for (const c of cases) counts[c.category] = (counts[c.category] ?? 0) + 1;
    for (const [category, minimum] of Object.entries(MINIMUM_PER_CATEGORY)) {
      expect({ category, count: counts[category] ?? 0 }).toEqual({
        category,
        count: expect.any(Number),
      });
      expect(counts[category] ?? 0).toBeGreaterThanOrEqual(minimum);
    }
    expect(counts.spec ?? 0).toBeGreaterThanOrEqual(22);
  });

  it('matches every spec example exactly and at least 95% overall', () => {
    const failing: string[] = [];
    const failingSpec: string[] = [];
    for (const testCase of cases) {
      if (!isDeepStrictEqual(run(testCase), testCase.expected)) {
        failing.push(testCase.id);
        if (testCase.category === 'spec') failingSpec.push(testCase.id);
      }
    }

    const passRate = (cases.length - failing.length) / cases.length;
    const specTotal = cases.filter((c) => c.category === 'spec').length;
    // Ids only: never print the sentences.
    console.info(
      `golden pass rate ${(passRate * 100).toFixed(1)}% (${cases.length - failing.length}/${cases.length}); ` +
        `spec ${specTotal - failingSpec.length}/${specTotal}; failing ids: ${failing.join(', ') || 'none'}`,
    );

    expect(failingSpec).toEqual([]);
    expect(passRate).toBeGreaterThanOrEqual(0.95);
  });
});
