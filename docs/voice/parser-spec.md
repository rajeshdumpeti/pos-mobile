# POS Voice parser spec (VOICE-M2)

Source: POS-VOICE-PRD-001 v1.0, founder-approved 2026-11-19, decisions D1–D15. This file is the
repo's source of truth for the grammar. It is saved verbatim from the approved VOICE-M2 prompt.

## PARSER SPEC

1. LOCATION AND RULES

- Code: src/features/voice/parser/ (index.ts exports the public API). No npm dependencies; built-in Intl only. Do not import from other features; reuse nothing that would create a cross-feature dependency.
- Pure and deterministic: same input → same output. Never read the system clock or device timezone inside the parser; they are inputs.
- Never log, print or persist the input text or results (D15). Tests may use synthetic sentences.
- Export VOICE_GRAMMAR_VERSION = '1.0.0' (semver). Every result carries grammarVersion. Any change to behavior bumps the version.

2. API

```ts
type ParseInput = {
  text: string; // recognized words from the on-device transcriber
  contextDate: string; // 'YYYY-MM-DD' — today on Today/Quick Log, selected date on Plan
  timezone: string; // IANA, e.g. 'America/New_York' (device timezone, D7)
  now: Date; // current instant (for "today", past checks)
};
type Proposal = {
  title: string; // 1–200 chars after cleanup
  date: string; // 'YYYY-MM-DD'
  dateSource: 'spoken' | 'context';
  startTime: string | null; // 'HH:MM' 24h local wall time, or null (unscheduled, D8)
  endTime: string | null; // 'HH:MM', only when startTime is set (end requires start)
  isPriority: boolean;
};
type Clarification =
  | {
      kind: 'meridiem';
      options: Array<{ label: string; startTime: string; endTime: string | null }>;
    }
  | { kind: 'next_weekday'; options: Array<{ label: string; date: string }> }
  | { kind: 'midnight' }
  | {
      kind: 'time_passed';
      options: [{ label: 'Keep today'; date: string }, { label: 'Move to tomorrow'; date: string }];
    }
  | { kind: 'time_nonexistent' } // DST spring-forward gap
  | { kind: 'time_ambiguous_offset'; options: Array<{ label: string; offset: string }> } // DST fall-back overlap
  | { kind: 'date_invalid' } // e.g. "February 30"
  | { kind: 'date_unsupported' } // "next week", "this weekend", "next month"
  | { kind: 'title_missing' };
type Hint = 'duration_without_start_ignored' | 'end_after_midnight_dropped' | 'title_truncated';
type RejectionReason = 'empty' | 'unsupported_action' | 'multiple_requests' | 'past_date';
type ParseResult =
  | {
      kind: 'proposal';
      proposal: Proposal;
      clarifications: Clarification[];
      hints: Hint[];
      grammarVersion: string;
    }
  | { kind: 'rejection'; reason: RejectionReason; grammarVersion: string };
export function parseVoiceInput(input: ParseInput): ParseResult;
```

A proposal with one or more clarifications is not ready; the review card (M4) must resolve them before Add is enabled. When a field needs a clarification, the proposal still carries the best non-guessed state (e.g. startTime null until the meridiem is chosen) — never a silent guess.

3. RESOLUTION ORDER
   normalize → detect rejection (empty, unsupported action, multiple requests) → extract priority → extract time → extract date → apply context defaults → past/time-passed/DST checks → remaining words minus lead-ins = title.

4. NORMALIZATION

- Case-insensitive matching; collapse whitespace; strip surrounding punctuation; keep the title's original casing except first letter capitalized.
- Ignore fillers anywhere: um, uh, er, hmm; and leading "please", "okay", "ok", "hey".
- Numbers as words: one–twelve, thirteen–twenty-three, fifteen, thirty, forty-five, "half" (as in "an hour and a half"); "a.m."/"am"/"a m", "p.m."/"pm"/"p m"; "o'clock".
- Times may arrive as "7", "7 am", "7:30 pm", "7:30PM", "seven thirty pm", "17:00", "1700"? (support "17:00" only, not "1700").

5. REJECTIONS (no proposal; M4 shows a message plus "Type it instead")

- empty: nothing left after normalization.
- unsupported_action: explicit manipulation of existing items only. Patterns: "mark … (as) done|complete|completed|finished", "check off …", "delete …", "remove … (from my list|plan|today)?", "cancel … from my list|plan|today", "move … to <date/time>", "reschedule …", "change … to …", "edit …", "complete my|the …". Be conservative: "cancel gym membership", "finish report", "complete tax form" are normal tasks and must produce proposals.
- multiple_requests: a second date phrase or a second time phrase for a different task, or list markers ("two things", "and also", "and then", "first … then", "as well as"). "Buy bread and milk" is ONE task (one date, no list words).
- past_date: "yesterday", "last <weekday>", "last week", or an absolute date with an explicit year that is before contextDate's today. (Dates before today are not allowed in v1, D10.)

6. LEAD-INS AND TRAILERS (removed from the title)
   Leading: add, create, put, schedule, plan, new task, make a task, remind me to, remind me, I need to, I have to, I've got to, I gotta, don't forget to, can you add, could you add.
   Trailing: to my list, to the list, to my plan, to the plan, to today, for today (only when "today" is the date phrase), on my calendar, to my calendar.
   "Remind me to call mom at 5 pm" → title "Call mom", 17:00. (No reminder object is created; v1 creates plan items only.)

7. PRIORITY
   important, priority, high priority, top priority, urgent, it's urgent → isPriority true; remove the word(s) and any adjacent ":" "-" "," from the title.

8. DATES

- No date spoken → contextDate, dateSource 'context' (D6).
- today → today in timezone; tonight → today (and implies PM, see 9); tomorrow; day after tomorrow; in N days (N = 1–365, digits or words); "in a day" = tomorrow.
- tomorrow morning/afternoon/evening/night → tomorrow + daypart.
- Weekday ("friday", "on friday", "this friday"): next occurrence counting today (said on a Friday → today).
- "next <weekday>": clarification next_weekday with two options: A = next occurrence strictly after today, B = A + 7 days; labels like "Fri, Nov 27". date stays at A? NO — set date to A only after the user chooses; until then keep A in proposal.date and include the clarification (Add stays disabled by M4).
- Absolute: "november 21", "nov 21", "nov 21st", "21st of november", "the 21st", "on the 1st", optional year "november 21 2027". Without a year: next occurrence that is today or later. Ordinal day alone: this month if ≥ today's day, else next month. Impossible dates (Feb 30, April 31) → clarification date_invalid (date = contextDate).
- "next week", "this weekend", "next weekend", "next month", "end of the month", "in N weeks" → clarification date_unsupported (date = contextDate). Do not silently map them.
- Spoken date always overrides contextDate (VX-11).

9. TIMES

- Explicit meridiem ("7 am", "7:30 pm") or 24-hour ("17:00", hours 13–23 bare like "at 17") → exact.
- noon / midday → 12:00. midnight → clarification midnight (startTime null).
- Bare hour/minute without meridiem ("at 7", "at 7:30"):
  - daypart decides: morning → AM; afternoon → PM; evening, night, tonight → PM; "this morning" etc. same.
  - no daypart → clarification meridiem with options [AM, PM] (labels "7 AM", "7 PM"); startTime null.
  - hour 12 bare → meridiem clarification (12 PM noon vs 12 AM).
- Daypart without a time ("tomorrow morning") → no time (unscheduled); daypart only informs meridiem.
- Range: "from 9 to 11 am", "9 to 11 am", "9-11am", "between 2 and 4 pm": a meridiem stated once applies to both if that gives start < end; else meridiem clarification with both interpretations. End must be > start on the same date.
- Duration with a start: "for 45 minutes", "for an hour", "for 2 hours", "for an hour and a half", "for 1.5 hours", "for 90 minutes" → endTime = start + duration. If the end passes midnight → drop end, hint end_after_midnight_dropped.
- Duration without a start → ignore it, hint duration_without_start_ignored, startTime null.
- Time passed: if date is today (in timezone) and startTime is before now → clarification time_passed with options Keep today (today) / Move to tomorrow (today + 1). Applies to both context and spoken "today".

10. DST (use Intl with the given timezone; no libraries)

- Local time that does not exist on that date (spring-forward gap) → clarification time_nonexistent; startTime null.
- Local time that occurs twice (fall-back overlap) → clarification time_ambiguous_offset with the two UTC offsets as options; startTime kept.

11. TITLE

- Remaining words after removing fillers, lead-ins, trailers, priority words, date and time phrases, and dangling prepositions at the end ("at", "on", "for", "by", "to").
- Trim, collapse spaces, strip trailing punctuation, capitalize the first letter.
- Empty → clarification title_missing (title '').
- Over 200 chars → cut at the last word boundary ≤ 200, hint title_truncated.

12. DOMAIN WORDS ARE NOT ROUTED
    "Workout tomorrow at 7 am" → proposal title "Workout", tomorrow, 07:00 (a plan item, not a Workout session — AC-05).

13. REQUIRED SPEC EXAMPLES (must all pass exactly; clock = Wed 2026-11-18 14:00 America/New_York, contextDate 2026-11-18 unless noted)

- "Add buy groceries to today" → title "Buy groceries", 2026-11-18, spoken, no time.
- "Call mom" with contextDate 2026-11-21 (Plan) → 2026-11-21, context, no time.
- "Dentist in 3 days" → 2026-11-21.
- "Gym Friday" → 2026-11-20.
- "Pay rent on the 1st" → 2026-12-01.
- "Yesterday call Sam" → rejection past_date.
- "Workout tomorrow at 7 am" → 2026-11-19, 07:00.
- "Meeting at 3" → clarification meridiem [3 AM, 3 PM], startTime null.
- "Lunch with Ana at noon" → title "Lunch with Ana", 12:00 — wait: today 12:00 is before 14:00 → also time_passed clarification.
- "Submit at midnight" → clarification midnight.
- "Deep work 9 to 11 am tomorrow" → 2026-11-19, 09:00–11:00.
- "Run at 6 pm for 45 minutes" → 18:00–18:45.
- "Read for 30 minutes" → no time, hint duration_without_start_ignored.
- "Gym at 7 am" (today, now 14:00) → 07:00 with time_passed clarification.
- "Urgent: send invoice" → title "Send invoice", isPriority true.
- "Mark gym as done" → rejection unsupported_action.
- "Gym at 7 and dentist at 3" → rejection multiple_requests.
- "Tomorrow at 5 pm" → title "", title_missing, 2026-11-19, 17:00.
- "Buy bread and milk" → one proposal, title "Buy bread and milk".
- "Next Friday dinner with Priya" → next_weekday options Fri Nov 20 / Fri Nov 27.
- "Remind me to call mom at 5 pm" → "Call mom", 17:00.
- "Finish report tomorrow" → proposal, "Finish report", 2026-11-19 (not a rejection).
- DST: timezone America/New_York, contextDate 2027-03-14, now 2027-03-13T12:00-05:00, "Flight check-in at 2:30 am" → time_nonexistent. contextDate 2027-11-07, "Call at 1:30 am" → time_ambiguous_offset (-04:00 / -05:00).
