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
mk('crash', lambda: P(lp(noise(2.2), 1600) * env(2.2, 0.08, 1.7) * 1.2, 0.5 * bp(noise(1.2), 2000, 7000) * env(1.2, 0.05, 3), 0.6 * lp(noise(0.5), 200) * env(0.5, 0.02, 6)))
mk('clack', lambda: P(bp(noise(0.03), 2000, 6000) * env(0.03, 0.0005, 150), 0.6 * np.pad(bp(noise(0.03), 2500, 7000) * env(0.03, 0.0005, 150), (int(SR * 0.07), 0))))
def gull_():
    t = tt(0.9); f = np.interp(t, [0, 0.12, 0.5, 0.9], [900, 1600, 1250, 900]); x = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f * (1 + 0.03 * np.sin(2 * np.pi * 30 * t))) / SR)), 3500) * np.sin(np.pi * t / 0.9) ** 0.5
    return np.concatenate([x * 0.8, np.zeros(int(SR * 0.1)), x[: int(len(x) * 0.6)] * 0.6])
mk('gull', gull_)
mk('swell', lambda: tvfilter(noise(2.0), 150, 1200, q=1.5, blocks=40) * (tt(2.0) / 2.0) ** 1.5 * 2.5)
mk('splash', lambda: P(bp(noise(0.8), 400, 6000) * env(0.8, 0.005, 5), 0.5 * lp(noise(0.4), 300) * env(0.4, 0.005, 9)))
mk('bell', lambda: P(bell(1318, 1.4, 3), 0.7 * np.pad(bell(1760, 1.2, 3), (int(SR * 0.13), 0))))
def shore(d): t = tt(d); sw = 0.45 + 0.55 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 6.5)) ** 2; return lp(noise(d), 900) * sw * np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 0.8) * 1.4
def sandshift(d):
    x = np.zeros(int(SR * d)); r = np.random.default_rng(9); o = 0
    while o < len(x) - 2000: c = bp(noise(0.02), 3000, 9000) * env(0.02, 0.001, 150) * r.uniform(0.3, 1); x[o:o + len(c)] += c[:len(x) - o]; o += int(SR * r.uniform(0.01, 0.05))
    return x * np.minimum(1, tt(d) / 0.3)
def patter(d):
    x = np.zeros(int(SR * d)); r = np.random.default_rng(4); o = 0
    while o < len(x) - 3000: c = bp(noise(0.04), 600, 3000) * env(0.04, 0.002, 70) * r.uniform(0.5, 1); x[o:o + len(c)] += c[:len(x) - o]; o += int(SR * r.uniform(0.15, 0.2))
    return x
def heart(d):
    x = np.zeros(int(SR * d)); o = 0
    while o < len(x) - 12000: b = np.sin(2 * np.pi * np.cumsum(55 + 25 * np.exp(-tt(0.18) * 20)) / SR) * env(0.18, 0.004, 16); x[o:o + len(b)] += b; o2 = o + int(SR * 0.22); x[o2:o2 + len(b)] += b[:len(x) - o2] * 0.7; o += int(SR * 1.05)
    return x
def underwater(d): t = tt(d); return (lp(noise(d), 300) * 1.6 + 0.3 * np.sin(2 * np.pi * 60 * t)) * np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 1.0)
LOOPS = {'shore': shore, 'sandshift': sandshift, 'patter': patter, 'heart': heart, 'underwater': underwater, 'dig': dig, 'march': march, 'drumroll': drumroll, 'crickets': crickets, 'water': water, 'gush': gush, 'wind': wind, 'brush': brush, 'drone': drone, 'bubble': bubble, 'hum': hum, 'steps': steps, 'rustle': rustle, 'buzz': buzz, 'siren': siren, 'ff': ff, 'cricket': cricket, 'birds': birds, 'alarm': alarm, 'typing': typing}

for k, v in S.items(): sf.write(f'assets/sfx/{k}.wav', v.astype(np.float32), SR)

sfx = np.zeros(N)
for c in json.load(open('plan/cues.json')):
    x = norm(LOOPS[c['type']](c['dur'])) if c['type'] in LOOPS else S[c['type']]
    o = int(c['t'] * SR); x = x[:N - o] * c['gain']; sfx[o:o + len(x)] += x

# ---------------- music: emotional piano + strings, 72 BPM, B minor → D major lift; sparse in the struggle, swells at the lift ----------------
beats_j = json.load(open('plan/beats.json')); SEC = beats_j['sections']; cues = json.load(open('plan/cues.json'))
BPM = 72; beat = 60 / BPM; bar = beat * 4
def piano(f, d=2.4): t = tt(d); return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * (1.3 + 0.9 * m)) for m, a in [(1, 1), (2, .35), (3, .12), (4, .05)]) * np.minimum(1, t / 0.006)
def strings(f, d): t = tt(d); v = 1 + 0.004 * np.sin(2 * np.pi * 5 * t); return lp(sum(((np.cumsum(f * v * (1 + dt)) / SR) % 1 * 2 - 1) for dt in (-0.004, 0, 0.004)) / 3, 2400) * np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 1.0)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
SAD = [[47, 54, 59, 62], [43, 50, 55, 59], [50, 57, 62, 66], [45, 52, 57, 61]]     # Bm G D A
music = np.zeros(N)
def put(x, t, g=1.0):
    o = int(t * SR)
    if o >= N or o < 0: return
    x = x[:N - o]; music[o:o + len(x)] += x * g
lift_t = next(c['t'] for c in cues if c['type'] == 'swell') + 0.4
dive_t = next(c['t'] for c in cues if c['type'] == 'splash')
def layer(t):
    if t < SEC[1]['start']: return dict(pno=0.7, str=0.25, hi=0)
    if t < SEC[3]['start']: return dict(pno=0.8, str=0.4, hi=0.3)
    if t < SEC[6]['start']: return dict(pno=0.6, str=0.3, hi=0)          # the struggle: thinner
    if t < lift_t: return dict(pno=0.9, str=0.6, hi=0.4)
    return dict(pno=1.0, str=1.0, hi=1.0)                                 # the lift + swim: full
MEL = [74, 73, 71, 69, 71, 73, 74, 76]
b_ = 0
while b_ * bar < DUR - 1.5:
    t0 = b_ * bar; L = layer(t0 + 0.01); ch = SAD[b_ % 4]
    for i, m in enumerate([ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12]): put(piano(hz(m)), t0 + i * beat / 2, 0.11 * L['pno'])
    put(piano(hz(ch[0] - 12), 3.5), t0, 0.16 * L['pno'])
    for m in ch[1:]: put(strings(hz(m), bar + 1.2), t0, 0.07 * L['str'])
    if L['hi']: put(piano(hz(MEL[b_ % 8] + 12), 2.6), t0 + beat, 0.12 * L['hi']); put(piano(hz(MEL[(b_ + 3) % 8] + 12), 2.2), t0 + beat * 2.5, 0.08 * L['hi'])
    b_ += 1
for m in [50, 57, 62, 66, 69, 74]: put(strings(hz(m), 5.0), DUR - 5.2, 0.06)   # final D major bloom
put(sum(piano(hz(m), 4) for m in [74, 78, 81, 86]), DUR - 2.0, 0.12)
tN = np.arange(N) / SR; g = np.clip((DUR - 0.2 - tN) / 1.8, 0, 1) * (1 - 0.35 * ((tN > dive_t - 0.2) & (tN < dive_t + 0.6)))
music *= g
sf.write('assets/music/music_v1.wav', norm(music, 0.8).astype(np.float32), SR)

# ---------------- mix ----------------
vo, vsr = sf.read('assets/vo/vo_v1.wav'); vo = resample_poly(vo, SR, vsr)[:N]; vo = np.pad(vo, (0, N - len(vo)))
vo = hp(vo, 80)
e = lp(np.abs(vo), 6, 1); e = e / (e.max() or 1)
duck = 1 - 0.55 * np.clip(e * 4, 0, 1)                      # ≈ -7 dB under VO
mix = vo * 0.8 + norm(music, 0.8) * 0.62 * duck + hp(sfx, 120) * 0.27
mix = np.tanh(mix * 1.1) / 1.1                              # gentle safety saturation
sf.write('cache/mix_premaster.wav', np.stack([mix, mix], 1).astype(np.float32), SR)
print('wrote cache/mix_premaster.wav', f'{len(cues)} cues')
