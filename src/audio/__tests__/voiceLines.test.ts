import { cueSentence, spokenPhaseName, numberToWords, COUNTDOWN_SENTENCE } from '../voiceLines';
import { allVoiceSentences } from '../allVoiceSentences';
import voiceManifest from '../voiceManifest.json';
import { SESSION_TEMPLATES } from '../../config/sessionTemplates';
import { parseSessionPhases } from '../../utils/sessionParsers';
import * as fs from 'fs';
import * as path from 'path';

describe('spoken phrases', () => {
  it('speaks phase names as words, without timings', () => {
    expect(spokenPhaseName('Comfortable Hold 3/7 (01:36)')).toBe('comfortable hold, three out of seven');
    expect(spokenPhaseName('CO₂ Tolerance Hold 1/3')).toBe('C O two tolerance hold, one out of three');
    expect(spokenPhaseName('O₂ Hold 2/5 (65% of max - 02:36)')).toBe('O two hold, two out of five');
    expect(spokenPhaseName('50% of max (02:00)')).toBe('hold at fifty percent of max');
    expect(spokenPhaseName('Breathe-up (03:00)')).toBe('breathe up');
  });

  it('builds the cue sentences', () => {
    expect(cueSentence('phaseStart', { phaseDescription: 'Max Hold 1/2' })).toBe('Begin max hold, one out of two.');
    expect(cueSentence('phaseEnd', { phaseDescription: 'Max Hold 1/2' })).toBe('Max hold, one out of two, complete.');
    expect(cueSentence('minuteMark', { minutes: 1 })).toBe('One minute.');
    expect(cueSentence('minuteMark', { minutes: 21 })).toBe('Twenty one minutes.');
    expect(cueSentence('minuteMark', { minutes: 0 })).toBe('');
  });

  it('spells numbers', () => {
    expect(numberToWords(0)).toBe('zero');
    expect(numberToWords(45)).toBe('forty five');
    expect(numberToWords(105)).toBe('one hundred and five');
  });
});

describe('voice recordings', () => {
  const manifest = voiceManifest as { countdown: string; sentences: Record<string, string> };
  const voiceDir = path.join(__dirname, '../../../public/voice');

  it('has a recording for every sentence the built-in sessions can say', () => {
    const missing = allVoiceSentences().filter((s) => !manifest.sentences[s]);
    expect(missing).toEqual([]);
  });

  it('covers every phase of every built-in session, at any max hold', () => {
    for (const [type, template] of Object.entries(SESSION_TEMPLATES)) {
      for (const maxHold of [45, 150, 400]) {
        for (const phase of parseSessionPhases(type, template, maxHold)) {
          for (const cue of ['phaseStart', 'phaseEnd'] as const) {
            const sentence = cueSentence(cue, { phaseDescription: phase.description });
            expect(manifest.sentences[sentence]).toBeDefined();
          }
        }
      }
    }
  });

  it('has every listed file on disk, and the countdown', () => {
    const files = [manifest.countdown, ...Object.values(manifest.sentences)];
    expect(files.filter((f) => !fs.existsSync(path.join(voiceDir, f)))).toEqual([]);
    expect(manifest.sentences[COUNTDOWN_SENTENCE]).toBeUndefined();
  });

  it('the service worker index matches the app manifest', () => {
    const index = JSON.parse(fs.readFileSync(path.join(voiceDir, 'index.json'), 'utf8'));
    expect(index).toEqual(voiceManifest);
  });
});
