#!/usr/bin/env python3
"""Synthesize SFX + music (all generated in code, no licensing), mix under the VO with ducking.
Reads plan/cues.json + assets/vo/vo_v1.wav → writes assets/sfx/*.wav, assets/music/music_v1.wav, cache/mix_premaster.wav
Loudness normalisation (-14 LUFS / -1.5 dBTP) is done afterwards with ffmpeg loudnorm (two-pass) in scripts/finish.sh.
"""
import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

SR = 48000
DUR = json.load(open('plan/beats.json'))['duration']
N = int(SR * DUR)
rng = np.random.default_rng(7)
tt = lambda d: np.arange(int(SR * d)) / SR
env = lambda d, a=0.005, k=8.0: np.minimum(1, tt(d) / a) * np.exp(-tt(d) * k)
noise = lambda d: rng.standard_normal(int(SR * d))
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def sweep(f0, f1, d, shape='exp'):
    k = tt(d) / d; f = f0 * (f1 / f0) ** k if shape == 'exp' else f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(x, peak=0.9): m = np.max(np.abs(x)) or 1; return x / m * peak
def tvfilter(x, f0, f1, q=3.0, blocks=60):  # time-varying bandpass by blocks with crossfade
    out = np.zeros_like(x); L = len(x); bl = L // blocks + 1
    for i in range(blocks):
        c = f0 * (f1 / f0) ** (i / (blocks - 1)); s, e = i * bl, min(L, (i + 1) * bl + 256)
        out[s:e] += bp(x[s:e], c / (1 + 1 / q), min(c * (1 + 1 / q), SR / 2 - 100)) * (np.hanning(e - s) if e - s > 2 else 1)
    return out

def bell(f, d=1.2, k=4.0): t = tt(d); return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * k * m ** 0.5) for m, a in [(1, 1), (2.76, .5), (5.4, .25), (8.9, .12)])

S = {}
def P(*xs):  # padded sum of different-length signals
    L = max(len(x) for x in xs); return sum(np.pad(x, (0, L - len(x))) for x in xs)
def mk(name, fn): S[name] = norm(fn())
mk('pop', lambda: P(sweep(1100, 260, 0.09) * env(0.09, 0.002, 30), 0.3 * hp(noise(0.01), 3000) * env(0.01, 0.001, 300)))
mk('tick_soft', lambda: np.sin(2 * np.pi * 1900 * tt(0.03)) * env(0.03, 0.001, 140) * 0.6)
mk('tick', lambda: (np.sin(2 * np.pi * 1250 * tt(0.06)) + 0.5 * np.sin(2 * np.pi * 2600 * tt(0.06))) * env(0.06, 0.001, 70))
mk('whoosh', lambda: tvfilter(noise(0.5), 300, 4000) * np.sin(np.pi * tt(0.5) / 0.5) ** 2)
mk('swoosh', lambda: tvfilter(noise(0.3), 600, 6000) * np.sin(np.pi * tt(0.3) / 0.3) ** 2)
mk('swipe', lambda: tvfilter(noise(0.18), 1500, 8000, blocks=20) * np.sin(np.pi * tt(0.18) / 0.18) ** 2)
def sparkle():
    x = np.zeros(int(SR * 0.9))
    for i in range(9):
        f = 2200 * 2 ** (rng.integers(0, 12) / 12 * 1.5); s = int(SR * i * 0.07); b = bell(f, 0.4, 9) * 0.5; x[s:s + len(b)] += b[:len(x) - s]
    return x
mk('sparkle', sparkle)
mk('boing', lambda: np.sin(2 * np.pi * np.cumsum(220 + 260 * (1 - np.exp(-tt(0.55) * 6)) + 30 * np.sin(2 * np.pi * 14 * tt(0.55))) / SR) * env(0.55, 0.003, 5))
mk('chime', lambda: P(bell(1046, 1.6, 2.5), 0.6 * np.pad(bell(1568, 1.4, 2.5), (int(SR * .12), 0))[:int(SR * 1.6)]))
mk('ding', lambda: bell(1568, 1.0, 4))
mk('click', lambda: P(np.sin(2 * np.pi * 900 * tt(0.02)) * env(0.02, 0.0005, 200), 0.4 * hp(noise(0.004), 2000)))
mk('stamp', lambda: P(np.sin(2 * np.pi * np.cumsum(140 * np.exp(-tt(0.35) * 8) + 50) / SR) * env(0.35, 0.002, 9), 0.5 * lp(noise(0.12), 2500) * env(0.12, 0.001, 30)))
mk('thud', lambda: P(np.sin(2 * np.pi * np.cumsum(90 * np.exp(-tt(0.4) * 6) + 40) / SR) * env(0.4, 0.002, 8), 0.3 * lp(noise(0.08), 900) * env(0.08, 0.001, 40)))
mk('gulp', lambda: np.concatenate([sweep(500, 140, 0.08) * env(0.08, 0.002, 25), np.zeros(int(SR * .05)), sweep(420, 120, 0.09) * env(0.09, 0.002, 22)]))
mk('buzzer', lambda: lp(np.clip(2.5 * (np.sign(np.sin(2 * np.pi * 110 * tt(0.7))) + np.sign(np.sin(2 * np.pi * 117 * tt(0.7)))), -1, 1), 2500) * np.minimum(1, tt(0.7) / 0.01) * np.minimum(1, (0.7 - tt(0.7)) / 0.08))
mk('rise', lambda: (sweep(300, 1400, 0.9) * 0.6 + 0.4 * tvfilter(noise(0.9), 500, 6000, blocks=30)) * (tt(0.9) / 0.9) ** 1.5 * np.minimum(1, (0.9 - tt(0.9)) / 0.05))
mk('yawn', lambda: np.sin(2 * np.pi * np.cumsum(np.interp(tt(0.9), [0, 0.25, 0.9], [500, 900, 260]) * (1 + 0.01 * np.sin(2 * np.pi * 6 * tt(0.9)))) / SR) * np.sin(np.pi * tt(0.9) / 0.9))
mk('poof', lambda: P(lp(noise(0.5), 1800) * env(0.5, 0.01, 7), 0.3 * sweep(600, 200, 0.2) * env(0.2, 0.002, 15)))
mk('alert', lambda: np.concatenate([np.sin(2 * np.pi * 1000 * tt(0.11)) * env(0.11, 0.002, 6), np.zeros(int(SR * .06)), np.sin(2 * np.pi * 1330 * tt(0.16)) * env(0.16, 0.002, 6)]))
def aww():  # sweet harp gliss
    x = np.zeros(int(SR * 1.4))
    for i, s in enumerate([0, 4, 7, 12, 16, 19, 24]):
        b = bell(523 * 2 ** (s / 12), 0.9, 5) * 0.6; o = int(SR * i * 0.06); x[o:o + len(b)] += b[:len(x) - o]
    return x
mk('aww', aww)
# variable-length loops
def buzz(d): t = tt(d); gate = (np.sin(2 * np.pi * 4 * t) > 0); return lp(np.sign(np.sin(2 * np.pi * 150 * t)), 600) * gate * 0.8
def siren(d): t = tt(d); f = np.where((t * 3.3).astype(int) % 2, 880, 660); return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.minimum(1, (d - t) / 0.2)
def ff(d): t = tt(d); f = 300 + 900 * ((t * 9) % 1); return lp(2 * ((np.cumsum(f) / SR) % 1) - 1, 3000) * 0.5 * np.minimum(1, (d - t) / 0.1)
def cricket(d):
    t = tt(d); car = np.sin(2 * np.pi * 4600 * t); am = (np.sin(2 * np.pi * 30 * t) > 0.3) * ((t * 2.4) % 1 < 0.35); return car * am * 0.5
def birds(d):
    x = np.zeros(int(SR * d))
    for i in range(int(d * 3.2)):
        o = int(SR * (i / 3.2 + rng.uniform(0, 0.15))); f0 = rng.uniform(2600, 4200)
        for j in range(rng.integers(2, 4)):
            c = sweep(f0, f0 * rng.uniform(1.2, 1.6), 0.07) * env(0.07, 0.005, 25); s = o + int(SR * j * 0.09); x[s:s + len(c)] += c[:max(0, len(x) - s)]
    return x * 0.6
def alarm(d): t = tt(d); return np.sin(2 * np.pi * 2100 * t) * ((t * 8) % 1 < 0.5) * ((t * 1.25) % 1 < 0.6) * 0.6
def typing(d):
    x = np.zeros(int(SR * d)); o = 0
    while o < len(x) - 2000: c = S['click'] * rng.uniform(0.5, 1); x[o:o + len(c)] += c[:len(x) - o]; o += int(SR * rng.uniform(0.05, 0.11))
    return x
mk('hop', lambda: sweep(260, 520, 0.12) * env(0.12, 0.004, 22) * 0.8)
mk('snap', lambda: P(hp(noise(0.05), 1500) * env(0.05, 0.0005, 80), 0.6 * sweep(900, 300, 0.06) * env(0.06, 0.001, 50), 0.5 * lp(noise(0.25), 3000) * env(0.25, 0.002, 18)))
mk('crunch', lambda: P(*[np.pad(bp(noise(0.03), 1200, 5000) * env(0.03, 0.001, 90) * rng.uniform(0.5, 1), (int(SR * j * 0.035), 0)) for j in range(5)]))
def rustle(d): x = bp(noise(d), 1500, 7000); return x * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * tt(d)))) * np.minimum(1, tt(d) / 0.05) * np.minimum(1, (d - tt(d)) / 0.1)
def grumble(d=1.0): t = tt(d); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(70 + 25 * np.sin(2 * np.pi * 3 * t)) / SR)), 300) * np.sin(np.pi * t / d) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
mk('grumble', lambda: grumble(1.0))
mk('boom', lambda: P(np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-tt(1.6) * 4)) / SR) * env(1.6, 0.004, 2.2), 0.4 * lp(noise(0.6), 500) * env(0.6, 0.002, 6)))
mk('creak', lambda: bp(lp(np.sign(np.sin(2 * np.pi * np.cumsum(np.interp(tt(0.7), [0, 0.35, 0.7], [140, 220, 170])) / SR)) * (np.sin(2 * np.pi * 23 * tt(0.7)) > 0), 1500), 200, 2500) * np.sin(np.pi * tt(0.7) / 0.7))
mk('error', lambda: np.concatenate([np.sin(2 * np.pi * 520 * tt(0.09)) * env(0.09, 0.002, 12), np.zeros(int(SR * .03)), np.sin(2 * np.pi * 390 * tt(0.14)) * env(0.14, 0.002, 10)]))
mk('cash', lambda: P(bell(2093, 0.7, 6), np.pad(bell(2637, 0.6, 6), (int(SR * 0.07), 0)), 0.4 * hp(noise(0.08), 4000) * env(0.08, 0.001, 50)))
mk('slide', lambda: bp(noise(0.55), 250, 1800) * np.sin(np.pi * tt(0.55) / 0.55) * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * tt(0.55))))
mk('clank', lambda: P(bell(620, 0.8, 7) * 0.8, bell(1370, 0.5, 9) * 0.5, 0.5 * hp(noise(0.03), 2000) * env(0.03, 0.001, 120)))
def hum(d): t = tt(d); return (np.sin(2 * np.pi * 120 * t) * 0.6 + np.sin(2 * np.pi * 240 * t) * 0.3 + 0.15 * bp(noise(d), 2000, 6000)) * np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.3)
def steps(d):
    x = np.zeros(int(SR * d)); o = 0
    while o < len(x) - 4000: c = P(lp(noise(0.06), 700) * env(0.06, 0.001, 50), 0.3 * bp(noise(0.03), 2000, 5000) * env(0.03, 0.001, 90)); x[o:o + len(c)] += c[:len(x) - o]; o += int(SR * 0.42)
    return x
mk('crack', lambda: P(hp(noise(0.04), 2500) * env(0.04, 0.0005, 100), 0.7 * np.pad(hp(noise(0.03), 1800) * env(0.03, 0.0005, 120), (int(SR * 0.05), 0)), 0.4 * sweep(500, 140, 0.1) * env(0.1, 0.001, 30)))
def brush(d): t = tt(d); return bp(noise(d), 2500, 9000) * (0.35 + 0.65 * np.abs(np.sin(2 * np.pi * 1.1 * t))) * np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.2)
def drone(d): t = tt(d); return (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t) + 0.3 * np.sin(2 * np.pi * 110.6 * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t)) * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
def bubble(d):
    x = np.zeros(int(SR * d)); r = np.random.default_rng(3); o = 0
    while o < len(x) - 6000: f = r.uniform(300, 900); c = sweep(f, f * 1.8, 0.05) * env(0.05, 0.002, 40) * r.uniform(0.3, 1); x[o:o + len(c)] += c; o += int(SR * r.uniform(0.08, 0.25))
    return x
mk('snuff', lambda: P(lp(noise(0.25), 1200) * env(0.25, 0.005, 14), 0.3 * sweep(300, 120, 0.15) * env(0.15, 0.002, 20)))
def crickets(d):
    t = tt(d); x = np.zeros(len(t))
    for f, rate, ph in [(4300, 2.1, 0), (4700, 1.7, 0.4), (3900, 2.6, 0.9)]:
        x += np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * 28 * t) > 0.2) * (((t * rate + ph) % 1) < 0.28) * 0.3
    return x * np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.0)
def water(d): t = tt(d); return lp(noise(d), 180, 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t)) * np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.0) * 3
def gush(d): t = tt(d); return (lp(noise(d), 900) * 0.8 + 0.3 * bp(noise(d), 1500, 5000)) * np.minimum(1, t / 0.15) * np.exp(-t * 0.5) * np.minimum(1, (d - t) / 0.5)
def wind(d): t = tt(d); return tvfilter(noise(d), 200, 900, q=2, blocks=40) * (0.5 + 0.5 * np.sin(np.pi * t / d)) * 1.5
def oink_():
    t = tt(0.32); f = 260 + 120 * np.sin(np.pi * t / 0.32)
    x = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.6 + 0.4 * np.sin(2 * np.pi * 34 * t)), 1800) * np.sin(np.pi * t / 0.32)
    return np.concatenate([x, np.zeros(int(SR * 0.06)), x[: int(len(x) * 0.7)] * 0.8])
mk('oink', oink_)
mk('scratch', lambda: tvfilter(noise(0.35), 3000, 300, q=4, blocks=20) * np.sin(np.pi * tt(0.35) / 0.35) * 2)
mk('thunder', lambda: lp(noise(2.2), 400) * env(2.2, 0.05, 1.6) * 2)
mk('gunshot', lambda: P(hp(noise(0.08), 900) * env(0.08, 0.0005, 60) * 1.4, lp(noise(0.9), 600) * env(0.9, 0.002, 5), np.sin(2 * np.pi * np.cumsum(60 + 80 * np.exp(-tt(0.5) * 12)) / SR) * env(0.5, 0.002, 7)))
mk('horn', lambda: lp(sum(np.sign(np.sin(2 * np.pi * f * tt(1.4))) for f in (110, 138.6)), 900) * np.minimum(1, tt(1.4) / 0.1) * np.minimum(1, (1.4 - tt(1.4)) / 0.3) * 0.5)
def fan(): x = np.zeros(int(SR * 1.3));
fan = None
def fanfare():
    x = np.zeros(int(SR * 1.4))
    for i, (m, d) in enumerate([(67, .14), (67, .14), (67, .14), (72, .7)]):
        f = 440 * 2 ** ((m - 69) / 12); n = sum(np.sign(np.sin(2 * np.pi * f * h * tt(d))) / h for h in (1, 2)) * np.minimum(1, tt(d) / 0.01) * np.minimum(1, (d - tt(d)) / 0.05)
        o = int(SR * i * 0.16); x[o:o + len(n)] += lp(n, 3000)[:len(x) - o]
    return x
mk('fanfare', fanfare)
def trombone():
    x = np.zeros(int(SR * 2.6)); notes = [(62, .45), (61, .45), (60, .45), (59, 1.1)]
    o = 0
    for m, d in notes:
        t_ = tt(d); f = 440 * 2 ** ((m - 69) / 12) * (1 + 0.01 * np.sin(2 * np.pi * 5 * t_) * (t_ / d))
        n = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 1100) * np.minimum(1, t_ / 0.03) * np.minimum(1, (d - t_) / 0.06)
        x[o:o + len(n)] += n; o += int(SR * d)
    return x
mk('trombone', trombone)
def dig(d): x = np.zeros(int(SR * d)); o = 0; r = np.random.default_rng(5)
def dig(d):
    x = np.zeros(int(SR * d)); r = np.random.default_rng(5); o = 0
    while o < len(x) - 4000: c = bp(noise(0.07), 300, 2500) * env(0.07, 0.003, 40) * r.uniform(0.5, 1); x[o:o + len(c)] += c[:len(x) - o]; o += int(SR * r.uniform(0.09, 0.16))
    return x
def march(d):
    x = np.zeros(int(SR * d)); o = 0
    while o < len(x) - 4000: c = P(lp(noise(0.09), 500) * env(0.09, 0.002, 35), 0.3 * bp(noise(0.04), 2000, 5000) * env(0.04, 0.001, 80)); x[o:o + len(c)] += c[:len(x) - o]; o += int(SR * 0.26)
    return x
def drumroll(d): t = tt(d); return bp(noise(d), 200, 3000) * (0.5 + 0.5 * (np.sin(2 * np.pi * 22 * t) > 0)) * (0.4 + 0.6 * t / d) * np.minimum(1, (d - t) / 0.03)
LOOPS = {'dig': dig, 'march': march, 'drumroll': drumroll, 'crickets': crickets, 'water': water, 'gush': gush, 'wind': wind, 'brush': brush, 'drone': drone, 'bubble': bubble, 'hum': hum, 'steps': steps, 'rustle': rustle, 'buzz': buzz, 'siren': siren, 'ff': ff, 'cricket': cricket, 'birds': birds, 'alarm': alarm, 'typing': typing}

for k, v in S.items(): sf.write(f'assets/sfx/{k}.wav', v.astype(np.float32), SR)

sfx = np.zeros(N)
for c in json.load(open('plan/cues.json')):
    x = norm(LOOPS[c['type']](c['dur'])) if c['type'] in LOOPS else S[c['type']]
    o = int(c['t'] * SR); x = x[:N - o] * c['gain']; sfx[o:o + len(x)] += x

# ---------------- music: comic fife-and-drum march, 116 BPM, G major; stops for the gunshot and the final count ----------------
beats_j = json.load(open('plan/beats.json')); SEC = beats_j['sections']; cues = json.load(open('plan/cues.json'))
BPM = 116; beat = 60 / BPM; bar = beat * 4
def fife(f, d): t = tt(d); return (np.sin(2 * np.pi * f * t * (1 + 0.004 * np.sin(2 * np.pi * 6 * t))) + 0.15 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.04)
def pizz(f, d=0.3): t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 12)
def snare(): return bp(noise(0.12), 1500, 6000) * env(0.12, 0.001, 30) * 0.7
def bassd(): return np.sin(2 * np.pi * np.cumsum(55 + 60 * np.exp(-tt(0.2) * 30)) / SR) * env(0.2, 0.002, 14)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
music = np.zeros(N)
def put(x, t, g=1.0):
    o = int(t * SR)
    if o >= N or o < 0: return
    x = x[:N - o]; music[o:o + len(x)] += x * g
PROG = [55, 50, 55, 50, 48, 50, 55, 55]  # G D G D C D G G (bass roots)
MEL = [[71, 74, 79, 74], [72, 76, 74, 72], [71, 74, 79, 83], [81, 78, 74, 76], [76, 72, 69, 72], [74, 78, 81, 78], [79, 74, 71, 74], [79, 79, 79, 0]]
b_ = 0
while b_ * bar < DUR - 1.0:
    t0 = b_ * bar; root = PROG[b_ % 8]
    put(pizz(hz(root - 12)), t0, 0.5); put(pizz(hz(root - 5)), t0 + beat, 0.3); put(pizz(hz(root - 12)), t0 + 2 * beat, 0.5); put(pizz(hz(root - 5)), t0 + 3 * beat, 0.3)
    for i, m in enumerate(MEL[b_ % 8]):
        if m: put(fife(hz(m), beat * 0.85), t0 + i * beat, 0.16)
    for i in range(4): put(bassd(), t0 + i * beat, 0.35 if i % 2 == 0 else 0.15); put(snare(), t0 + i * beat + beat / 2, 0.25); put(snare(), t0 + i * beat + beat * 0.75, 0.12)
    b_ += 1
tN = np.arange(N) / SR; g = np.ones(N)
def gap(a, b, fade=0.06): g[:] = np.minimum(g, np.clip(np.maximum((a - tN) / fade, (tN - b) / fade), 0, 1))
gs = next(c['t'] for c in cues if c['type'] == 'gunshot'); gap(gs - 0.1, gs + 1.2)
fin = next(c['t'] for c in cues if c['type'] == 'drumroll'); gap(fin - 0.1, DUR)
music *= g
sf.write('assets/music/music_v1.wav', norm(music, 0.8).astype(np.float32), SR)

# ---------------- mix ----------------
vo, vsr = sf.read('assets/vo/vo_v1.wav'); vo = resample_poly(vo, SR, vsr)[:N]; vo = np.pad(vo, (0, N - len(vo)))
vo = hp(vo, 80)
e = lp(np.abs(vo), 6, 1); e = e / (e.max() or 1)
duck = 1 - 0.55 * np.clip(e * 4, 0, 1)                      # ≈ -7 dB under VO
mix = vo * 0.8 + norm(music, 0.8) * 0.21 * duck + hp(sfx, 120) * 0.32
mix = np.tanh(mix * 1.1) / 1.1                              # gentle safety saturation
sf.write('cache/mix_premaster.wav', np.stack([mix, mix], 1).astype(np.float32), SR)
print('wrote cache/mix_premaster.wav', f'{len(cues)} cues')
