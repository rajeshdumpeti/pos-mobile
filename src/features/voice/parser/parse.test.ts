import { parseVoiceInput, VOICE_GRAMMAR_VERSION, type ParseInput } from './index';

const BASE: Omit<ParseInput, 'text'> = {
  contextDate: '2026-11-18',
  timezone: 'America/New_York',
  now: new Date('2026-11-18T19:00:00.000Z'),
};

const parse = (text: string, overrides: Partial<ParseInput> = {}) =>
  parseVoiceInput({ ...BASE, text, ...overrides });

describe('parseVoiceInput', () => {
  it('exports a semver grammar version and stamps every result with it', () => {
    expect(VOICE_GRAMMAR_VERSION).toBe('1.0.0');
    for (const text of ['call mom', 'mark gym done', '']) {
      expect(parse(text).grammarVersion).toBe(VOICE_GRAMMAR_VERSION);
    }
  });

  it('is deterministic', () => {
    const text = 'Gym tomorrow at 7 am for an hour';
    expect(parse(text)).toEqual(parse(text));
  });

  it('uses the supplied clock, not the system clock', () => {
    const early = parse('Gym at 8 am', { now: new Date('2026-11-18T12:00:00.000Z') }); // 07:00 EST
    const late = parse('Gym at 8 am', { now: new Date('2026-11-18T19:00:00.000Z') }); // 14:00 EST
    expect(early).toMatchObject({ kind: 'proposal', clarifications: [] });
    expect(late).toMatchObject({
      kind: 'proposal',
      clarifications: [{ kind: 'time_passed' }],
    });
  });

  it('uses the supplied timezone for today', () => {
    const now = new Date('2026-11-19T03:00:00.000Z');
    const ny = parse('Call mom today', { now });
    const kolkata = parse('Call mom today', { now, timezone: 'Asia/Kolkata' });
    expect(ny).toMatchObject({ proposal: { date: '2026-11-18' } });
    expect(kolkata).toMatchObject({ proposal: { date: '2026-11-19' } });
  });

  it('resolves a Plan context date without a spoken date', () => {
    expect(parse('Call mom', { contextDate: '2026-12-05' })).toMatchObject({
      proposal: { date: '2026-12-05', dateSource: 'context' },
    });
  });

  it('lets a spoken date override the context date', () => {
    expect(parse('Call mom tomorrow', { contextDate: '2026-12-05' })).toMatchObject({
      proposal: { date: '2026-11-19', dateSource: 'spoken' },
    });
  });

  it('keeps a proposal with clarifications free of silent guesses', () => {
    const result = parse('Meeting at 3');
    expect(result).toMatchObject({
      proposal: { startTime: null, endTime: null },
      clarifications: [{ kind: 'meridiem' }],
    });
  });

  it('never routes domain words', () => {
    expect(parse('Workout tomorrow at 7 am')).toMatchObject({
      proposal: { title: 'Workout', date: '2026-11-19', startTime: '07:00' },
    });
  });

  it('returns a rejection for each reason', () => {
    expect(parse('   ')).toMatchObject({ reason: 'empty' });
    expect(parse('delete my gym')).toMatchObject({ reason: 'unsupported_action' });
    expect(parse('gym at 7 and dentist at 3')).toMatchObject({ reason: 'multiple_requests' });
    expect(parse('gym yesterday')).toMatchObject({ reason: 'past_date' });
  });

  it('never throws on odd input', () => {
    const odd = [
      '',
      ' ',
      '!!!',
      'a'.repeat(5000),
      '😀 call mom 😀',
      'at at at at',
      'for for for 5',
      '9-',
      '-9',
      'from to',
      'next',
      'in',
      '1:99 pm',
      'at 13 pm',
      'february 30 2027 at 25:61',
      'between and',
      "o'clock",
      'a m',
    ];
    for (const text of odd) expect(() => parse(text)).not.toThrow();
  });

  it('keeps a proposal inside the schema limits', () => {
    const result = parse(`Buy ${Array(80).fill('apples').join(' ')}`);
    expect(result.kind).toBe('proposal');
    if (result.kind === 'proposal') {
      expect(result.proposal.title.length).toBeGreaterThanOrEqual(1);
      expect(result.proposal.title.length).toBeLessThanOrEqual(200);
      expect(result.proposal.endTime === null || result.proposal.startTime !== null).toBe(true);
    }
  });

  it('keeps recurrence words in the title and flags them without repeating anything', () => {
    const result = parse('Gym every friday at 7 am');
    expect(result).toMatchObject({
      kind: 'proposal',
      proposal: { title: 'Gym every friday', date: '2026-11-20', startTime: '07:00' },
      hints: ['recurrence_not_supported'],
    });
    expect(parse('Water plants daily')).toMatchObject({
      proposal: { title: 'Water plants daily' },
      hints: ['recurrence_not_supported'],
    });
    expect(parse('Gym tomorrow')).toMatchObject({ hints: [] });
  });

  it('orders hints: duration, end dropped, recurrence, then title', () => {
    const long = Array(60).fill('apples').join(' ');
    const result = parse(`Buy ${long} daily`);
    expect(result).toMatchObject({ hints: ['recurrence_not_supported', 'title_truncated'] });
  });

  it('treats plain delete, remove and cancel as normal tasks', () => {
    expect(parse('Delete old photos')).toMatchObject({ kind: 'proposal' });
    expect(parse('Remove the trash')).toMatchObject({ kind: 'proposal' });
    expect(parse('Move to the new apartment on Saturday')).toMatchObject({
      proposal: { title: 'Move to the new apartment', date: '2026-11-21' },
    });
  });
});
