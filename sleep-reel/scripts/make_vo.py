#!/usr/bin/env python3
"""Generate the VO with Kokoro (local TTS), phrase by phrase, placed on the script timestamps.
Writes assets/vo/vo_v1.wav (60 s timeline) and plan/beats.json (section/phrase/word timings).
Word times inside a phrase are estimated from phoneme counts; phrase edges are measured from the audio.
Usage: python3 scripts/make_vo.py [--voice af_bella] [--speed 1.1]
"""
import json, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

args = sys.argv[1:]
opt = lambda k, d: args[args.index('--' + k) + 1] if '--' + k in args else d
VOICE, BASE_SPEED = opt('voice', 'af_bella'), float(opt('speed', '1.05'))
SR, TOTAL = 24000, 60.0

# (start, end, spoken text, on-screen text). Spoken text spells numbers/symbols as said.
SECTIONS = [
    (0, 8, "Tonight is the night. No screens, eight full hours of restorative sleep, and a fresh start tomorrow morning!",
     "Tonight is the night. No screens, 8 full hours of restorative sleep, and a fresh start tomorrow morning!"),
    (8, 18, "Just one quick check. It could be an emergency, or someone sending something critical. Ten seconds, max.",
     "Just one quick check. It could be an emergency, or someone sending something critical. 10 seconds, max."),
    (18, 30, "Fast forward three minutes, and suddenly I'm deeply invested in whether sea otters hold hands when they sleep, so they don't drift away.",
     "Fast forward 3 minutes, and suddenly I'm deeply invested in whether sea otters hold hands when they sleep, so they don't drift away."),
    (30, 42, "It's fine! If I fall asleep right this second, I still get exactly four hours, twenty-two minutes, and twelve seconds of sleep. That's medically sufficient... right?",
     "It's fine! If I fall asleep right this second, I still get exactly 4 hours, 22 minutes, and 12 seconds of sleep. That's medically sufficient... right?"),
    (42, 52, "Wrong. The sun is up, the birds are mocking me, and I know everything about eighteenth-century shipbuilding, but nothing about staying awake.",
     "Wrong. The sun is up, the birds are mocking me, and I know everything about 18th-century shipbuilding, but nothing about staying awake."),
    (52, 60, "If you're watching this in bed at two AM right now, go to sleep! Or at least drop a comment, so we can suffer together.",
     "If you're watching this in bed at 2:00 AM right now, go to sleep! Or at least drop a comment, so we can suffer together."),
]

def phrases(text):
    # split after , . ! ? … keeping punctuation; "..." stays with its phrase
    parts = re.findall(r'.+?(?:\.\.\.|[,.!?])(?=\s|$)|.+$', text.strip())
    return [p.strip() for p in parts if p.strip()]

def gap_after(p):
    if p.endswith('...'): return 0.45
    return {',': 0.10, '.': 0.28, '!': 0.28, '?': 0.30}.get(p[-1], 0.1)

def trim(a, thr=0.012):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a, 0
    s, e = max(idx[0] - int(0.01 * SR), 0), min(idx[-1] + int(0.04 * SR), len(a))
    return a[s:e], s

k = Kokoro('models/kokoro/kokoro-v1.0.onnx', 'models/kokoro/voices-v1.0.bin')
ph_len = lambda w: len(k.tokenizer.phonemize(w, 'en-us').replace(' ', '')) or 1

def synth_section(spoken, speed):
    out = []
    for p in phrases(spoken):
        a, _ = k.create(p, voice=VOICE, speed=speed, lang='en-us')
        a, _ = trim(np.asarray(a, dtype=np.float32))
        out.append((p, a))
    dur = sum(len(a) / SR + gap_after(p) for p, a in out) - gap_after(out[-1][0])
    return out, dur

timeline = np.zeros(int(TOTAL * SR), dtype=np.float32)
beats = {"voice": VOICE, "duration": TOTAL, "sections": []}
for si, (s0, s1, spoken, shown) in enumerate(SECTIONS):
    budget = (s1 - s0) - 0.45            # lead-in 0.15 s + tail breathing room
    speed = BASE_SPEED
    out, dur = synth_section(spoken, speed)
    while dur > budget and speed < 1.45:  # only speed up if it doesn't fit
        speed = round(min(1.45, speed * dur / budget + 0.02), 3)
        out, dur = synth_section(spoken, speed)
    # spread spare time into the pauses (comedic beats), max +0.7 s per pause, keep ~0.6 s at the end
    gaps = [gap_after(p) for p, _ in out[:-1]]
    slack = max(0.0, budget - 0.15 - dur)
    extra = [min(0.7, slack * g / sum(gaps)) for g in gaps] if gaps else []
    dur += sum(extra)
    t = s0 + 0.15
    sec = {"i": si, "start": s0, "end": s1, "speed": speed, "vo_end": round(t + dur, 3), "phrases": []}
    shown_ph = phrases(shown)
    for pi, (p, a) in enumerate(out):
        i0 = int(t * SR); timeline[i0:i0 + len(a)] += a[:len(timeline) - i0]
        d = len(a) / SR
        words_spoken, words_shown = p.split(), shown_ph[pi].split()
        # map shown words to spoken words: same count → 1:1, otherwise spread proportionally
        w_sp = [ph_len(re.sub(r"[^\w'-]", '', w)) + 1.5 for w in words_spoken]
        edges = np.concatenate([[0], np.cumsum(w_sp) / sum(w_sp)])
        n = len(words_shown); ws = []
        for wi, w in enumerate(words_shown):
            a0 = edges[int(round(wi * len(words_spoken) / n))]
            a1 = edges[int(round((wi + 1) * len(words_spoken) / n))]
            ws.append({"w": w, "t0": round(t + a0 * d * 0.97, 3), "t1": round(t + a1 * d * 0.97, 3)})
        sec["phrases"].append({"text": shown_ph[pi], "t0": round(t, 3), "t1": round(t + d, 3), "words": ws})
        t += d + (gap_after(p) + extra[pi] if pi < len(extra) else 0)
    beats["sections"].append(sec)
    print(f"section {si}: {s0:>2}-{s1:<2}s  speed {speed}  speech {dur:5.2f}s / slot {s1 - s0}s")

peak = np.max(np.abs(timeline)); timeline *= 0.89 / peak  # -1 dBFS peak before mix
sf.write('assets/vo/vo_v1.wav', timeline, SR)
json.dump(beats, open('plan/beats.json', 'w'), indent=1)
print('wrote assets/vo/vo_v1.wav, plan/beats.json')
