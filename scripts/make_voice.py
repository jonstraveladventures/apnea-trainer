#!/usr/bin/env python3
"""Record every sentence the app speaks, with Kokoro, into public/voice/.

The sentences come from the app's own code (src/audio/allVoiceSentences.ts),
compiled with the project's TypeScript, so the recordings always match what
the app asks for. Each sentence is spoken by Kokoro-82M (Apache 2.0) through
`tts` (~/bin/tts, which runs it locally on MLX), levelled to the same loudness
and saved as a small mono MP3. The countdown is built from five single words
placed exactly one second apart, so "five" plays as the timer shows 5 and
"one" as it shows 1.

    python3 scripts/make_voice.py               # record what is new or changed
    python3 scripts/make_voice.py --force       # record everything again
    python3 scripts/make_voice.py --voice bf_emma --speed 0.9
    python3 scripts/make_voice.py --check       # also transcribe every file and compare

Writes public/voice/*.mp3, public/voice/index.json (read by the service
worker) and src/audio/voiceManifest.json (bundled into the app).
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE_DIR = ROOT / "public" / "voice"
APP_MANIFEST = ROOT / "src" / "audio" / "voiceManifest.json"
COMPILED = ROOT / "node_modules" / ".cache" / "apnea-voice"
TTS = os.path.expanduser("~/bin/tts")
TRANSCRIBE = os.path.expanduser("~/bin/transcribe")

COUNTDOWN_WORDS = ["Five.", "Four.", "Three.", "Two.", "One."]
COUNTDOWN_FILE = "countdown.mp3"
LOUDNESS = {"I": -16.0, "TP": -1.5, "LRA": 11.0}


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kw)


def list_sentences():
    """Compile the app's sentence list and return it."""
    shutil.rmtree(COMPILED, ignore_errors=True)
    run([
        "node", str(ROOT / "node_modules" / "typescript" / "bin" / "tsc"),
        "--outDir", str(COMPILED), "--rootDir", str(ROOT / "src"),
        "--module", "commonjs", "--target", "es2019", "--esModuleInterop",
        "--skipLibCheck", "--strict", str(ROOT / "src" / "audio" / "allVoiceSentences.ts"),
    ], cwd=ROOT)
    out = run([
        "node", "-e",
        "console.log(JSON.stringify(require(process.argv[1]).allVoiceSentences()))",
        str(COMPILED / "audio" / "allVoiceSentences.js"),
    ], cwd=ROOT).stdout
    return json.loads(out)


def file_id(sentence):
    slug = re.sub(r"[^a-z0-9]+", "-", sentence.lower()).strip("-")[:48]
    digest = hashlib.sha1(sentence.encode("utf-8")).hexdigest()[:6]
    return f"{slug}-{digest}"


def level_to_mp3(src, dest):
    """Two-pass loudness levelling to the same target, then a small mono MP3."""
    target = "I={I}:TP={TP}:LRA={LRA}".format(**LOUDNESS)
    measured = run([
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(src),
        "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-",
    ]).stderr
    stats = json.loads(measured[measured.rindex("{"):measured.rindex("}") + 1])
    second = (
        f"loudnorm={target}:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}"
        f":measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}"
        f":offset={stats['target_offset']}:linear=true"
    )
    run([
        "ffmpeg", "-hide_banner", "-y", "-i", str(src), "-af", second,
        "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "48k", str(dest),
    ])


def duration(path):
    return float(run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path),
    ]).stdout.strip())


def render(entries, voice, speed, work):
    """Render [{id, text}] to WAVs in `work` with Kokoro."""
    batch = work / "batch.json"
    batch.write_text(json.dumps(entries, ensure_ascii=False))
    run([TTS, "--batch", str(batch), "--out-dir", str(work), "--format", "wav",
         "--voice", voice, "--speed", str(speed)])


def build_countdown(voice, work):
    """Five words, each starting on a whole second, in a file exactly 5 s long."""
    words = [{"id": f"count-{i}", "text": w} for i, w in enumerate(COUNTDOWN_WORDS)]
    render(words, voice, 1.0, work)
    inputs, filters = [], []
    for i, w in enumerate(words):
        wav = work / f"{w['id']}.wav"
        length = duration(wav)
        if length > 0.95:
            sys.exit(f"Countdown word {w['text']!r} is {length:.2f} s, too long for its one-second slot.")
        inputs += ["-i", str(wav)]
        filters.append(f"[{i}:a]adelay={i * 1000}|{i * 1000}[w{i}]")
    mix = "".join(f"[w{i}]" for i in range(len(words)))
    filters.append(f"{mix}amix=inputs={len(words)}:normalize=0,apad,atrim=0:5[out]")
    assembled = work / "countdown.wav"
    run(["ffmpeg", "-hide_banner", "-y", *inputs, "-filter_complex", ";".join(filters),
         "-map", "[out]", str(assembled)])
    level_to_mp3(assembled, VOICE_DIR / COUNTDOWN_FILE)


SPOKEN_FORMS = {"co2": "c o two", "o2": "o two"}


def words_of(text):
    text = text.lower().replace("-", " ").replace("%", " percent")
    text = re.sub(r"\bc0(\d)", r"co\1", text)  # Whisper writes CO2 with a zero at times
    for k, v in SPOKEN_FORMS.items():
        text = re.sub(rf"\b{k}\b", v, text)
    text = re.sub(r"\d+", lambda m: number_words(int(m.group())), text)
    return re.findall(r"[a-z]+", text)


def number_words(n):
    ones = ("zero one two three four five six seven eight nine ten eleven twelve thirteen "
            "fourteen fifteen sixteen seventeen eighteen nineteen").split()
    tens = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
    if n < 20:
        return ones[n]
    if n < 100:
        return tens[n // 10] + ("" if n % 10 == 0 else " " + ones[n % 10])
    return str(n)


def check(manifest, work):
    """Transcribe every recording and compare its words with the sentence."""
    problems = []
    items = list(manifest["sentences"].items()) + [(" ".join(COUNTDOWN_WORDS), manifest["countdown"])]
    for sentence, name in items:
        copy = work / name
        shutil.copy(VOICE_DIR / name, copy)
        run([TRANSCRIBE, "-l", "en", str(copy)])
        heard = (work / (copy.stem + ".txt")).read_text()
        if words_of(heard) != words_of(sentence):
            problems.append((sentence, heard.strip()))
    for sentence, heard in problems:
        print(f"  MISMATCH  wanted: {sentence}\n            heard:  {heard}")
    print(f"Checked {len(items)} recordings: {len(items) - len(problems)} match, {len(problems)} differ.")
    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--voice", default="af_heart", help="Kokoro voice (tts --list-voices)")
    ap.add_argument("--speed", type=float, default=0.9, help="speaking speed for the sentences")
    ap.add_argument("--force", action="store_true", help="record every sentence again")
    ap.add_argument("--check", action="store_true", help="transcribe every file and compare")
    args = ap.parse_args()

    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    index_path = VOICE_DIR / "index.json"
    old = json.loads(index_path.read_text()) if index_path.exists() else {}
    same_voice = old.get("voice") == args.voice and old.get("speed") == args.speed and not args.force

    sentences = list_sentences()
    manifest = {"voice": args.voice, "speed": args.speed, "countdown": COUNTDOWN_FILE, "sentences": {}}
    todo = []
    for s in sentences:
        name = f"{file_id(s)}.mp3"
        manifest["sentences"][s] = name
        if not (same_voice and (VOICE_DIR / name).exists()):
            todo.append({"id": file_id(s), "text": s})

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        if todo:
            print(f"Recording {len(todo)} of {len(sentences)} sentences with {args.voice} at speed {args.speed}...")
            render(todo, args.voice, args.speed, work)
            for e in todo:
                level_to_mp3(work / f"{e['id']}.wav", VOICE_DIR / f"{e['id']}.mp3")
        if todo or not same_voice or not (VOICE_DIR / COUNTDOWN_FILE).exists():
            print("Building the countdown...")
            build_countdown(args.voice, work)

    keep = set(manifest["sentences"].values()) | {COUNTDOWN_FILE, "index.json"}
    for f in VOICE_DIR.iterdir():
        if f.name not in keep:
            f.unlink()

    text = json.dumps(manifest, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    index_path.write_text(text)
    APP_MANIFEST.write_text(text)

    total = sum(f.stat().st_size for f in VOICE_DIR.iterdir())
    print(f"{len(sentences)} sentences and the countdown in {VOICE_DIR.relative_to(ROOT)} "
          f"({total / 1024:.0f} KB). Countdown: {duration(VOICE_DIR / COUNTDOWN_FILE):.2f} s.")

    if args.check:
        with tempfile.TemporaryDirectory() as tmp:
            if check(manifest, Path(tmp)):
                sys.exit(1)


if __name__ == "__main__":
    main()
