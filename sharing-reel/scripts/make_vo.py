#!/usr/bin/env python3
"""Kokoro TTS voiceover, phrase by phrase, placed on the script timestamps; supports a character voice.
Writes assets/vo/vo_v1.wav and plan/beats.json (section / phrase / word timings; word times inside a phrase
are estimated from phoneme counts, phrase edges measured from the audio).
"""
import json, re, subprocess, tempfile, os
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

SR, TOTAL = 24000, 60.0
NARR = dict(voice='af_heart', speed=0.85, pitch=1.0)      # warm, gentle storyteller
TUTU = dict(voice='am_puck', speed=1.0, pitch=1.32)       # little bunny: brighter, ~+5 semitones
# (start, end, [(who, spoken, shown)])
SECTIONS = [
    (0, 12, [(NARR, "In the magical, sunny woods, Tutu the little bunny found the juiciest, reddest apple in the whole world!", None)]),
    (12, 24, [(NARR, "Tutu wanted to eat it all by himself... but then, he noticed little Misti, watching with big, hungry eyes.", None)]),
    (24, 40, [(NARR, "Tutu snapped the apple right in half.", None),
              (TUTU, "Here, Misti! Let's share!", "“Here, Misti! Let's share!”"),
              (NARR, "Because good friends always share.", None)]),
    (40, 60, [(NARR, "Sharing makes everything taste twice as sweet! Remember to share with your friends today... and tap follow, for more fun adventures!", None)]),
]

def phrases(text):
    parts = re.findall(r'.+?(?:\.\.\.|[,.!?]”?)(?=\s|$)|.+$', text.strip())
    return [p.strip() for p in parts if p.strip()]
def gap_after(p):
    p = p.rstrip('”')
    if p.endswith('...'): return 0.5
    return {',': 0.14, '.': 0.4, '!': 0.4, '?': 0.4}.get(p[-1], 0.12)
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

timeline = np.zeros(int(TOTAL * SR), dtype=np.float32)
beats = {"duration": TOTAL, "sections": []}
for si, (s0, s1, segs) in enumerate(SECTIONS):
    items = []  # (who, spoken phrase, shown phrase, audio)
    for who, spoken, shown in segs:
        sp, sh = phrases(spoken), phrases(shown or spoken)
        assert len(sp) == len(sh), (sp, sh)
        for p, q in zip(sp, sh):
            a, _ = k.create(p, voice=who['voice'], speed=who['speed'], lang='en-us')
            a = trim(pitch_shift(trim(np.asarray(a, np.float32)), who['pitch']))
            if who is TUTU: a = a * 1.1
            items.append((who, p, q, a))
    gaps = [gap_after(p) + (0.25 if items[i + 1][0] is not who else 0) for i, (who, p, q, a) in enumerate(items[:-1])]
    speech = sum(len(a) / SR for *_, a in items)
    budget = (s1 - s0) - 0.6 - 0.3                       # 0.3 s lead-in, keep ≥ 0.6 s tail
    slack = max(0.0, budget - speech - sum(gaps))
    caps = [0.12 if items[i][1].rstrip('\u201d').endswith(',') else 0.8 if items[i + 1][0] is not items[i][0] else 0.5 for i in range(len(gaps))]
    extra = [min(c, slack * g / sum(gaps)) for g, c in zip(gaps, caps)] if gaps else []
    t = s0 + 0.3
    sec = {"i": si, "start": s0, "end": s1, "phrases": []}
    for pi, (who, p, q, a) in enumerate(items):
        i0 = int(t * SR); timeline[i0:i0 + len(a)] += a[:len(timeline) - i0]
        d = len(a) / SR
        sw, qw = p.split(), q.split()
        w_sp = [ph_len(re.sub(r"[^\w'-]", '', w)) + 1.5 for w in sw]
        edges = np.concatenate([[0], np.cumsum(w_sp) / sum(w_sp)])
        ws = [{"w": w, "t0": round(t + edges[int(round(j * len(sw) / len(qw)))] * d * 0.97, 3),
               "t1": round(t + edges[int(round((j + 1) * len(sw) / len(qw)))] * d * 0.97, 3)} for j, w in enumerate(qw)]
        sec["phrases"].append({"text": q, "who": "tutu" if who is TUTU else "narrator", "t0": round(t, 3), "t1": round(t + d, 3), "words": ws})
        t += d + (gaps[pi] + extra[pi] if pi < len(gaps) else 0)
    sec["vo_end"] = round(t, 3)
    assert t <= s1 - 0.3, f"section {si} overruns: {t:.2f} > {s1}"
    beats["sections"].append(sec)
    print(f"section {si}: {s0:>2}-{s1:<2}s  speech {speech:5.2f}s  ends {t:5.2f}s")

timeline *= 0.89 / np.max(np.abs(timeline))
sf.write('assets/vo/vo_v1.wav', timeline, SR)
json.dump(beats, open('plan/beats.json', 'w'), indent=1)
print('wrote assets/vo/vo_v1.wav, plan/beats.json')
