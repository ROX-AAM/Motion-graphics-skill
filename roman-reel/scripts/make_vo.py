#!/usr/bin/env python3
"""Kokoro TTS voiceover, phrase by phrase, placed on the script timestamps; supports a character voice.
Writes assets/vo/vo_v1.wav and plan/beats.json (section / phrase / word timings; word times inside a phrase
are estimated from phoneme counts, phrase edges measured from the audio).
"""
import json, re, subprocess, tempfile, os
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

SR = 24000
NARR = dict(voice='af_heart', speed=0.9, pitch=1.0)      # mysterious, captivating storyteller
# (start, end, [(who, spoken, shown)])
SECTIONS = [
    (0, 15, [(NARR, "In Ancient Rome, pale skin was the ultimate symbol of wealth, and power. So every morning, rich noblewomen covered their faces in a luxurious white cream... that was slowly killing them.", None)]),
    (15, 30, [(NARR, "The secret ingredient was suh-russa. Pure white lead, made by soaking heavy metal in vinegar. It erased every blemish in seconds... but the poison seeped straight into their skin.",
                     "The secret ingredient was cerussa. Pure white lead, made by soaking heavy metal in vinegar. It erased every blemish in seconds... but the poison seeped straight into their skin.")]),
    (30, 45, [(NARR, "After a few months, the lead rotted their teeth, caused their hair to fall out, and left dark scars on their faces. And how did they hide the damage? By putting on an even thicker layer... of the exact same poison.", None)]),
    (45, 60, [(NARR, "Even though Roman doctors knew lead was toxic, fashion won over survival... turning the vanity mirror into the slowest assassin in the empire.", None)]),
]
TOTAL = 60.0
def phrases(text):
    parts = re.findall(r'.+?(?:\.\.\.|[,.!?]”?)(?=\s|$)|.+$', text.strip())
    return [p.strip() for p in parts if p.strip()]
def gap_after(p):
    p = p.rstrip('”')
    if p.endswith('...'): return 0.55
    return {',': 0.12, '.': 0.35, '!': 0.35, '?': 0.45}.get(p[-1], 0.1)
def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a
    return a[max(idx[0] - int(0.01 * SR), 0):min(idx[-1] + int(0.05 * SR), len(a))]
def pitch_shift(a, ratio):
    if abs(ratio - 1) < 1e-3: return a
    with tempfile.TemporaryDirectory() as d:
        i, o = os.path.join(d, 'i.wav'), os.path.join(d, 'o.wav'); sf.write(i, a, SR)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', i, '-af', f'rubberband=pitch={ratio}:formant=shifted', o], check=True)
        return sf.read(o)[0].astype(np.float32)

k = Kokoro('models/kokoro/kokoro-v1.0.onnx', 'models/kokoro/voices-v1.0.bin')
ph_len = lambda w: len(k.tokenizer.phonemize(w, 'en-us').replace(' ', '')) or 1

def build(segs, f):
    items = []
    for who, spoken, shown in segs:
        sp, sh = phrases(spoken), phrases(shown or spoken)
        assert len(sp) == len(sh), (sp, sh)
        for p, q in zip(sp, sh):
            a, _ = k.create(p, voice=who['voice'], speed=who['speed'] * f, lang='en-us')
            items.append((who, p, q, trim(pitch_shift(trim(np.asarray(a, np.float32)), who['pitch']))))
    return items
gaps_of = lambda items: [gap_after(p) + (0.25 if items[i + 1][0] is not w else 0) for i, (w, p, _, _) in enumerate(items[:-1])]
dur_of = lambda items: sum(len(a) / SR for *_, a in items) + sum(gaps_of(items))
def chain(durs):  # section starts: nominal, or pushed later if the previous one overruns
    starts, end = [], 0
    for (s0, s1, _), d in zip(SECTIONS, durs): st = max(s0, end + 0.3 if starts else s0); starts.append(st); end = st + 0.25 + d
    return starts, end
f = 1.0
for _ in range(5):
    secs = [build(segs, f) for *_, segs in SECTIONS]
    starts, end = chain([dur_of(x) for x in secs])
    print(f"speed x{f:.3f}: VO ends {end:.2f}s")
    if end <= TOTAL - 0.4 or f >= 1.2: break
    f = min(1.2, f * (end - 0.3 * len(SECTIONS)) / (TOTAL - 0.4 - 0.3 * len(SECTIONS)) + 0.005)
TOTAL = max(TOTAL, round(end + 1.2, 1))
timeline = np.zeros(int(TOTAL * SR), dtype=np.float32)
beats = {"duration": TOTAL, "speed": round(f, 3), "sections": []}
for si, ((_, _, segs), items, st) in enumerate(zip(SECTIONS, secs, starts)):
    nxt = starts[si + 1] if si + 1 < len(starts) else TOTAL
    gaps = gaps_of(items)
    slack = max(0.0, (nxt - st) - 0.25 - 0.35 - dur_of(items))
    caps = [0.1 if items[i][1].rstrip('\u201d').endswith(',') else 0.6 for i in range(len(gaps))]
    extra = [min(c, slack * g / sum(gaps)) for g, c in zip(gaps, caps)] if gaps else []
    t = st + 0.25
    sec = {"i": si, "start": round(st, 3), "end": round(nxt, 3), "phrases": []}
    for pi, (who, p, q, a) in enumerate(items):
        i0 = int(t * SR); timeline[i0:i0 + len(a)] += a[:len(timeline) - i0]
        d = len(a) / SR
        sw, qw = p.split(), q.split()
        w_sp = [ph_len(re.sub(r"[^\w'-]", '', w)) + 1.5 for w in sw]
        edges = np.concatenate([[0], np.cumsum(w_sp) / sum(w_sp)])
        ws = [{"w": w, "t0": round(t + edges[int(round(j * len(sw) / len(qw)))] * d * 0.97, 3),
               "t1": round(t + edges[int(round((j + 1) * len(sw) / len(qw)))] * d * 0.97, 3)} for j, w in enumerate(qw)]
        sec["phrases"].append({"text": q, "who": "narrator", "t0": round(t, 3), "t1": round(t + d, 3), "words": ws})
        t += d + (gaps[pi] + extra[pi] if pi < len(gaps) else 0)
    sec["vo_end"] = round(t, 3)
    beats["sections"].append(sec)
    print(f"section {si}: {st:5.2f}-{nxt:5.2f}s  speech ends {t:5.2f}s")
timeline *= 0.89 / np.max(np.abs(timeline))
sf.write('assets/vo/vo_v1.wav', timeline, SR)
json.dump(beats, open('plan/beats.json', 'w'), indent=1)
print('wrote assets/vo/vo_v1.wav, plan/beats.json')
