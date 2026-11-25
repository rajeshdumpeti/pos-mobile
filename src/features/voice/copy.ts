import type { Clarification, Hint, RejectionReason } from './parser';
import type { VoiceFailure } from './session/types';

/** Plain, honest copy. No "AI" or "assistant" wording, and nothing says Saved before the server confirms. */
export const voiceCopy = {
  micLabel: 'Add by voice',
  sheetLabel: 'Add a task by voice',
  consent: {
    heading: 'Add a task by voice',
    body: 'Speak one task. It’s turned into text on your iPhone. Audio and words never leave your device.',
    continue: 'Continue',
    notNow: 'Not now',
  },
  listening: { label: 'Listening…', hint: 'Say one task.', stop: 'Stop', cancel: 'Cancel' },
  parsing: 'Working it out…',
  review: { add: 'Add', cancel: 'Cancel', heard: 'Heard' },
  typeInstead: 'Type it instead',
  tryAgain: 'Try again',
  openSettings: 'Open Settings',
  close: 'Close',
  viewToday: 'View Today',
  view: 'View',
  saving: 'Adding…',
  stillTrying: 'Still trying to confirm this…',
  unknownOutcome: 'Couldn’t confirm. Check Today before adding it again.',
  permissionDenied:
    'Voice needs microphone and speech access. Turn them on in Settings, or type the task instead.',
} as const;

export const rejectionCopy: Record<RejectionReason, string> = {
  unsupported_action: 'Voice can add new tasks only. Edit or complete tasks on the list.',
  multiple_requests: 'One task at a time for now.',
  past_date: 'Voice can’t add items to past days yet.',
  empty: 'Didn’t catch that.',
};

export const hintCopy: Record<Hint, string> = {
  recurrence_not_supported: 'Repeating tasks aren’t supported yet — this adds one.',
  duration_without_start_ignored: 'A length was heard without a start time, so it was left out.',
  end_after_midnight_dropped: 'The end time would pass midnight, so it was left out.',
  title_truncated: 'The title was shortened to 200 characters.',
};

export function failureCopy(failure: VoiceFailure): string {
  switch (failure.kind) {
    case 'permission_denied':
      return voiceCopy.permissionDenied;
    case 'start_failed':
      return 'Voice isn’t available right now.';
    case 'interrupted':
    case 'backgrounded':
    case 'listen_error':
      return 'Voice stopped. Try again.';
    case 'rejection':
      return rejectionCopy[failure.reason];
    case 'no_timezone':
      return 'A valid device timezone is needed to add by voice.';
    case 'save_conflict':
      return 'Couldn’t add this. Check Today before trying again.';
    case 'save_unavailable':
      return failure.message;
  }
}

/** Prompt shown above the choices for a clarification. */
export function clarificationPrompt(clarification: Clarification): string {
  switch (clarification.kind) {
    case 'meridiem':
      return 'Which time do you mean?';
    case 'next_weekday':
      return 'Which day do you mean?';
    case 'midnight':
      return 'Midnight could be the start or the end of the day. Pick a time.';
    case 'time_nonexistent':
      return 'That time doesn’t exist on this date because the clocks change. Pick another time.';
    case 'time_ambiguous_offset':
      return 'This time happens twice that day. Which one do you mean?';
    case 'time_passed':
      return 'That time has already passed today.';
    case 'date_invalid':
      return 'That date doesn’t exist. Pick a date.';
    case 'date_unsupported':
      return 'That can’t be turned into one day. Pick a date.';
    case 'title_missing':
      return 'What’s the task? Add a title.';
  }
}

export function savedToast(date: string, today: string): string {
  if (date === today) return 'Added to Today';
  const label = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));
  return `Added to ${label}`;
}
