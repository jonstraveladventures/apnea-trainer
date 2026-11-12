import { AudioCueType } from '../types';

/**
 * Every spoken cue is built here, so the app and the recording script
 * (scripts/make_voice.py, through allVoiceSentences.ts) produce exactly the
 * same sentences. A sentence that has a recording in public/voice/ plays the
 * recording; any other (a custom session's own phase names, a template edited
 * to more rounds than the defaults) falls back to the browser's voice.
 */

export interface CueContext {
  /** Phase description as the session parsers write it, e.g. "Comfortable Hold 3/7 (01:36)". */
  phaseDescription?: string;
  /** Used by minuteMark: whole minutes elapsed in the current phase. */
  minutes?: number;
}

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** Spell a whole number from 0 to 999 as words. */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` and ${numberToWords(rest)}` : ''}`;
}

/**
 * Turn a phase description into words to be spoken: timings in brackets are
 * dropped, "3/7" becomes "three out of seven" (a plain "of" is swallowed in
 * Kokoro's speech: "four of five" sounds like "four-oh-five"), CO₂ and O₂ are spelt as letters,
 * hyphens become spaces and numbers become words.
 */
export function spokenPhaseName(description: string): string {
  let s = description
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_m, a, b) => `, ${numberToWords(+a)} out of ${numberToWords(+b)}`)
    .replace(/(\d+)\s*%/g, (_m, a) => `${numberToWords(+a)} percent`)
    .replace(/\d+/g, (m) => numberToWords(+m))
    .replace(/-/g, ' ')
    .toLowerCase()
    .replace(/co₂/g, 'C O two')
    .replace(/o₂/g, 'O two')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  s = s.replace(/^,\s*/, '');
  // "50% of max" on its own is a warm-up hold.
  if (/percent of max$/.test(s) && !/hold/.test(s)) s = `hold at ${s}`;
  return s;
}

const capitalise = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const SESSION_COMPLETE_SENTENCE = 'Session complete. Well done.';
export const VOICE_PREVIEW_SENTENCE = 'This is your training voice. Begin diaphragmatic breathing.';
/** Key of the countdown recording: five words placed exactly one second apart. */
export const COUNTDOWN_SENTENCE = 'Five. Four. Three. Two. One.';
/** Longest phase, in minutes, that has recorded minute marks. */
export const MAX_RECORDED_MINUTES = 30;

/** The sentence spoken for a cue, or '' when there is nothing useful to say. */
export function cueSentence(cueType: AudioCueType, ctx: CueContext = {}): string {
  const description = (ctx.phaseDescription || '').trim();
  const name = spokenPhaseName(description);
  switch (cueType) {
    case 'countdown':
      return COUNTDOWN_SENTENCE;
    case 'phaseStart':
      if (/^stretch confirmation$/i.test(description)) return 'Stretch first, then press ready.';
      return name ? `Begin ${name}.` : 'Begin.';
    case 'phaseEnd':
      // Commas give short pauses, so "hold, three out of five, complete" stays clear.
      return name ? `${capitalise(name)}${/, /.test(name) ? ',' : ''} complete.` : 'Complete.';
    case 'sessionComplete':
      return SESSION_COMPLETE_SENTENCE;
    case 'minuteMark':
      if (typeof ctx.minutes !== 'number' || ctx.minutes < 1) return '';
      return ctx.minutes === 1 ? 'One minute.' : `${capitalise(numberToWords(ctx.minutes))} minutes.`;
    default:
      return '';
  }
}
