import { SESSION_TEMPLATES } from '../config/sessionTemplates';
import { parseSessionPhases } from '../utils/sessionParsers';
import {
  cueSentence,
  COUNTDOWN_SENTENCE,
  MAX_RECORDED_MINUTES,
  SESSION_COMPLETE_SENTENCE,
  VOICE_PREVIEW_SENTENCE
} from './voiceLines';

/**
 * Every sentence the app can say with the built-in sessions at their default
 * settings, plus the minute marks, the session end and the settings preview.
 * The countdown is recorded separately (word by word) and is not listed.
 * Phase names don't depend on the max hold (timings are not spoken), so one
 * max hold covers them all.
 */
export function allVoiceSentences(): string[] {
  const sentences = new Set<string>();
  for (const [type, template] of Object.entries(SESSION_TEMPLATES)) {
    for (const phase of parseSessionPhases(type, template, 240)) {
      sentences.add(cueSentence('phaseStart', { phaseDescription: phase.description }));
      sentences.add(cueSentence('phaseEnd', { phaseDescription: phase.description }));
    }
  }
  for (let m = 1; m <= MAX_RECORDED_MINUTES; m++) {
    sentences.add(cueSentence('minuteMark', { minutes: m }));
  }
  sentences.add(SESSION_COMPLETE_SENTENCE);
  sentences.add(VOICE_PREVIEW_SENTENCE);
  sentences.add(cueSentence('phaseStart', {}));
  sentences.add(cueSentence('phaseEnd', {}));
  sentences.delete(COUNTDOWN_SENTENCE);
  sentences.delete('');
  return Array.from(sentences).sort();
}
