#!/usr/bin/env python3
"""Align the user's ElevenLabs voiceover (no transcriber available) to its known script.
Method: synthesize the same script with Kokoro (known phrase/word times), extract MFCCs from both,
DTW-align them, map every reference word time onto the user's audio, then snap phrase starts to
real speech onsets. Writes plan/beats.json (same format the renderer uses) and assets/vo/vo_v1.wav.
"""
import json, re, numpy as np, soundfile as sf, librosa
from kokoro_onnx import Kokoro

USER = 'assets/vo/user_vo.wav'
# sections → list of (spoken, shown); bracket cues become pauses: [p]=short pause, [P]=long pause, [x]=breath/sigh/gasp/etc.
SECTIONS = [
    [("Two of the most powerful countries on Earth got ready for war. [p] Over one pig. And wait till you hear how many people died. [x]", None)],
    [("It was eighteen fifty-nine, on San Juan Island, a quiet little island between the United States and Canada. Both countries said it was theirs. So British and American settlers lived side by side, and nobody was happy about it.",
      "It was 1859, on San Juan Island, a quiet little island between the United States and Canada. Both countries said it was theirs. So British and American settlers lived side by side, and nobody was happy about it.")],
    [("One morning, an American farmer named Lyman Cutlar found a pig digging up his potatoes. [p] Again. [x] The pig belonged to a British company. So Cutlar grabbed his rifle and shot it. [x]", None)],
    [("The British were furious and threatened to arrest him. The Americans sent soldiers to protect him. The British answered with warships. By the end of that summer, four hundred and sixty-one American soldiers with fourteen cannons were facing five British warships and more than two thousand men. All because of one hungry pig. [x]",
      "The British were furious and threatened to arrest him. The Americans sent soldiers to protect him. The British answered with warships. By the end of that summer, 461 American soldiers with 14 cannons were facing 5 British warships and more than 2,000 men. All because of one hungry pig. [x]")],
    [("But here's the thing. Nobody wanted to be the one who started a war over a pig. So the officers on both sides refused to fire. And the soldiers just... [p] stayed. For twelve years. Camping on opposite ends of the same island. [x]",
      "But here's the thing. Nobody wanted to be the one who started a war over a pig. So the officers on both sides refused to fire. And the soldiers just... [p] stayed. For 12 years. Camping on opposite ends of the same island. [x]")],
    [("In the end, the German Kaiser was asked to decide, and he gave the island to America. Final count of the Pig War? [P] One casualty. [p] The pig.", None)],
]
PAUSE = {'[p]': 0.45, '[P]': 1.3, '[x]': 0.6}

def tokens(text):  # phrases and pause markers, in order
    out = []
    for part in re.split(r'(\[[pPx]\])', text):
        part = part.strip()
        if not part: continue
        if part in PAUSE: out.append(('pause', part)); continue
        for ph in re.findall(r'.+?(?:\.\.\.|[,.!?])(?=\s|$)|.+$', part):
            if ph.strip(): out.append(('phrase', ph.strip()))
    return out
def gap_after(p): return 0.5 if p.endswith('...') else {',': 0.15, '.': 0.35, '!': 0.35, '?': 0.4}.get(p[-1], 0.12)
def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    return a if not len(idx) else a[max(idx[0] - 240, 0):min(idx[-1] + 1200, len(a))]

SR = 24000
k = Kokoro('models/kokoro/kokoro-v1.0.onnx', 'models/kokoro/voices-v1.0.bin')
ph_len = lambda w: len(k.tokenizer.phonemize(w, 'en-us').replace(' ', '')) or 1
user, usr_sr = sf.read(USER); user = user.astype(np.float32); U = len(user) / usr_sr

def build_ref(speed):
    ref, items, t = [], [], 0.0
    last_pause = None
    for si, sec in enumerate(SECTIONS):
        for spoken, shown in sec:
            sp_t, sh_t = tokens(spoken), tokens(shown or spoken)
            assert [x[0] for x in sp_t] == [x[0] for x in sh_t], (sp_t, sh_t)
            for (kind, p), (_, q) in zip(sp_t, sh_t):
                if kind == 'pause': ref.append(np.zeros(int(PAUSE[p] * SR), np.float32)); t += PAUSE[p]; last_pause = p; continue
                a, _ = k.create(p, voice='af_heart', speed=speed, lang='en-us'); a = trim(np.asarray(a, np.float32))
                items.append(dict(si=si, spoken=p, shown=q, t0=t, t1=t + len(a) / SR, after_x=last_pause == '[x]', after_pause=last_pause in ('[p]', '[P]'))); last_pause = None; ref.append(a); t += len(a) / SR
                g = gap_after(p); ref.append(np.zeros(int(g * SR), np.float32)); t += g
    return np.concatenate(ref), items

ref, items = build_ref(1.0)
speed = round(min(1.4, max(0.75, (len(ref) / SR) / U)), 3)   # match overall pace to the user's read
ref, items = build_ref(speed)
print(f'user {U:.2f}s  reference {len(ref)/SR:.2f}s  (kokoro speed x{speed})')

# --- DTW on MFCCs ---
fs, hop = 16000, 160
def feats(x, sr):
    y = librosa.resample(x, orig_sr=sr, target_sr=fs)
    m = librosa.feature.mfcc(y=y, sr=fs, n_mfcc=20, hop_length=hop, n_fft=512)[1:]
    e = librosa.feature.rms(y=y, hop_length=hop, frame_length=512)
    f = np.vstack([m, librosa.feature.delta(m), 8 * np.log(e + 1e-4)])
    return (f - f.mean(1, keepdims=True)) / (f.std(1, keepdims=True) + 1e-6)
Fr, Fu = feats(ref, SR), feats(user, usr_sr)
D, wp = librosa.sequence.dtw(X=Fr, Y=Fu, metric='cosine', step_sizes_sigma=np.array([[1, 1], [0, 1], [1, 0]]))
wp = wp[::-1]
rt, ut = wp[:, 0] * hop / fs, wp[:, 1] * hop / fs
# monotone map ref time → user time (median of matched user frames per ref frame)
uniq = np.unique(rt); umap = np.array([np.median(ut[rt == r]) for r in uniq])
M = lambda t: float(np.interp(t, uniq, umap))

# speech onsets in the user audio (to snap phrase starts)
yb = librosa.resample(user, orig_sr=usr_sr, target_sr=fs); rms = librosa.feature.rms(y=yb, hop_length=hop, frame_length=512)[0]
thr = np.percentile(rms, 30) * 2.2; speech = rms > thr
onsets = [i * hop / fs for i in range(1, len(speech)) if speech[i] and not speech[i - 1]]
def snap(t, win=0.3):
    c = [o for o in onsets if abs(o - t) <= win]
    return min(c, key=lambda o: abs(o - t)) if c else t

import subprocess
sd = subprocess.run(['ffmpeg', '-hide_banner', '-i', USER, '-af', 'silencedetect=n=-35dB:d=0.3', '-f', 'null', '-'], capture_output=True, text=True).stderr
SIL_END = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', sd)]
def snap_sil(t, win=0.8):
    c = [o for o in SIL_END if abs(o - t) <= win]
    return min(c, key=lambda o: abs(o - t)) if c else None
USED = set()
phr = []
for it in items:
    t0, t1 = M(it['t0']), M(it['t1'])
    prev = items[items.index(it) - 1]['spoken'] if items.index(it) else '.'
    new_sentence = it.get('after_pause') or prev.endswith(('.', '?', '!', '...'))
    sn = None if (it['after_x'] or not new_sentence) else snap_sil(t0)
    if sn is not None and sn in USED: sn = None
    if sn is not None: USED.add(sn)
    t0 = sn if sn is not None else snap(t0)
    sw, qw = it['spoken'].split(), it['shown'].split()
    w_sp = [ph_len(re.sub(r"[^\w'-]", '', w)) + 1.5 for w in sw]
    edges = np.concatenate([[0], np.cumsum(w_sp) / sum(w_sp)])
    # word times: map each word's reference time through the DTW path (keeps the user's own rhythm inside a phrase)
    rw = [it['t0'] + e * (it['t1'] - it['t0']) for e in edges]
    uw = [M(x) for x in rw]; d0 = t0 - uw[0]
    uw = [u + d0 * (1 - e) for u, e in zip(uw, edges)]   # shift the phrase start, keep its end
    ws = []
    for j, w in enumerate(qw):
        a = uw[int(round(j * len(sw) / len(qw)))]; b = uw[int(round((j + 1) * len(sw) / len(qw)))]
        ws.append({"w": w, "t0": round(max(a, t0), 3), "t1": round(max(b, a + 0.05), 3)})
    phr.append(dict(si=it['si'], text=it['shown'], t0=round(t0, 3), t1=round(max(t1, t0 + 0.2), 3), words=ws))
for a, b in zip(phr, phr[1:]):  # keep phrases ordered
    if b['t0'] < a['t0'] + 0.1: b['t0'] = round(a['t0'] + 0.1, 3)
for a, b in zip(phr, phr[1:]):  # words of a phrase must finish before the next phrase starts
    lim = b['t0'] - 0.15
    if a['words'][-1]['t0'] > lim:
        s0 = a['t0']; span = a['words'][-1]['t0'] - s0; k_ = (lim - s0) / span if span > 0 else 1
        for w in a['words']: w['t0'] = round(s0 + (w['t0'] - s0) * k_, 3); w['t1'] = round(min(w['t1'], b['t0']), 3)
        a['t1'] = round(min(a['t1'], b['t0'] - 0.05), 3)

DUR = round(U + 1.4, 1)
secs = []
for si in range(len(SECTIONS)):
    ps = [p for p in phr if p['si'] == si]
    start = 0.0 if si == 0 else round(ps[0]['t0'] - 0.25, 3)
    secs.append({"i": si, "start": start, "phrases": [{k_: v for k_, v in p.items() if k_ != 'si'} | {"who": "narrator"} for p in ps]})
for i, s in enumerate(secs): s['end'] = secs[i + 1]['start'] if i + 1 < len(secs) else DUR; s['vo_end'] = s['phrases'][-1]['t1']
json.dump({"duration": DUR, "source": "user ElevenLabs VO, DTW-aligned", "sections": secs}, open('plan/beats.json', 'w'), indent=1)
sf.write('assets/vo/vo_v1.wav', user, usr_sr)
for s in secs: print(f"S{s['i']} {s['start']:6.2f}-{s['end']:6.2f}  " + ' | '.join(f"{p['t0']:.2f} {p['text'][:22]}" for p in s['phrases']))
print('silences in user audio (for checking):', ', '.join(f'{o:.2f}' for o in onsets[:40]))
