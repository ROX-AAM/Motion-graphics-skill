#!/usr/bin/env python3
"""Synthesize SFX + music (all generated in code, no licensing), mix under the VO with ducking.
Reads plan/cues.json + assets/vo/vo_v1.wav → writes assets/sfx/*.wav, assets/music/music_v1.wav, cache/mix_premaster.wav
Loudness normalisation (-14 LUFS / -1.5 dBTP) is done afterwards with ffmpeg loudnorm (two-pass) in scripts/finish.sh.
"""
import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

SR, DUR = 48000, 60.0
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
LOOPS = {'buzz': buzz, 'siren': siren, 'ff': ff, 'cricket': cricket, 'birds': birds, 'alarm': alarm, 'typing': typing}

for k, v in S.items(): sf.write(f'assets/sfx/{k}.wav', v.astype(np.float32), SR)

sfx = np.zeros(N)
for c in json.load(open('plan/cues.json')):
    x = norm(LOOPS[c['type']](c['dur'])) if c['type'] in LOOPS else S[c['type']]
    o = int(c['t'] * SR); x = x[:N - o] * c['gain']; sfx[o:o + len(x)] += x

# ---------------- music: 120 BPM bouncy pluck + bass + drums ----------------
BPM = 120; beat = 60 / BPM; bar = beat * 4
def note(f, d, kind='pluck'):
    t = tt(d)
    if kind == 'pluck': return sum(a * np.sin(2 * np.pi * f * m * t) for m, a in [(1, 1), (2, .45), (3, .2), (4, .08)]) * np.exp(-t * 7) * np.minimum(1, t / 0.003)
    if kind == 'bass': return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 3) * np.minimum(1, t / 0.005) * np.minimum(1, (d - t) / 0.02)
    if kind == 'pad': return sum(np.sin(2 * np.pi * f * (1 + dt) * t) for dt in (-0.003, 0, 0.003)) / 3 * np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.3)
kick = lambda: np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-tt(0.25) * 30)) / SR) * env(0.25, 0.001, 12)
hat = lambda: hp(noise(0.04), 7000) * env(0.04, 0.0005, 90) * 0.35
clap = lambda: bp(noise(0.15), 900, 3000) * env(0.15, 0.002, 22) * 0.6
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
MAJ = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]   # C Am F G
MIN = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]]   # Am F Dm E (panic)
music = np.zeros(N)
def put(x, t, g=1.0):
    o = int(t * SR)
    if o >= N or o < 0: return
    x = x[:N - o]; music[o:o + len(x)] += x * g
def layer_at(t):  # arrangement per section
    if t < 8: return dict(prog=MAJ, arp=0.5, bass=0, drums=0, pad=0.5)
    if t < 18: return dict(prog=MAJ, arp=0.55, bass=0.6, drums=0.5, pad=0.3)
    if t < 30: return dict(prog=MAJ, arp=0.6, bass=0.7, drums=1, pad=0.2)
    if t < 42: return dict(prog=MIN, arp=0.55, bass=0.7, drums=0.8, pad=0.3)
    if t < 52: return dict(prog=MAJ, arp=0.6, bass=0.7, drums=1, pad=0.2)
    return dict(prog=MAJ, arp=0.6, bass=0.75, drums=1, pad=0.3)
b = 0
while b * bar < DUR - 0.5:
    t0 = b * bar; L = layer_at(t0 + 0.01); ch = L['prog'][b % 4]
    if L['pad']: [put(note(hz(m), bar, 'pad'), t0, 0.12 * L['pad']) for m in ch]
    if L['bass']: [put(note(hz(ch[0] - 24), beat * 0.9, 'bass'), t0 + i * beat, 0.55 * L['bass']) for i in range(4)]
    pattern = [0, 1, 2, 1, 2, 0, 1, 2]
    for i, p in enumerate(pattern): put(note(hz(ch[p] + 12), beat * 0.6), t0 + i * beat / 2, 0.22 * L['arp'])
    if L['drums']:
        for i in range(4):
            if i in (0, 2): put(kick(), t0 + i * beat, 0.7 * L['drums'])
            if i in (1, 3): put(clap(), t0 + i * beat, 0.35 * L['drums'])
            put(hat(), t0 + i * beat + beat / 2, 0.6 * L['drums'])
    b += 1
put(sum(note(hz(m + 12), 2.5, 'pluck') for m in [60, 64, 67, 72]) * 0.5, 59.0, 0.5)  # final chord

# music gaps: dramatic silence before "right?", hard stop on "Wrong."
cues = json.load(open('plan/cues.json'))
right_t = next(c['t'] for c in cues if c['type'] == 'gulp') - 0.1
g = np.ones(N); tN = np.arange(N) / SR
def gap(a, b_, fade=0.08):
    g[:] = np.minimum(g, np.clip(np.maximum((a - tN) / fade, (tN - b_) / fade), 0, 1))
gap(right_t - 1.6, right_t + 0.7); gap(42.05, 42.9, 0.03)
music *= g
sf.write('assets/music/music_v1.wav', norm(music, 0.8).astype(np.float32), SR)

# ---------------- mix ----------------
vo, vsr = sf.read('assets/vo/vo_v1.wav'); vo = resample_poly(vo, SR, vsr)[:N]; vo = np.pad(vo, (0, N - len(vo)))
vo = hp(vo, 80)
e = lp(np.abs(vo), 6, 1); e = e / (e.max() or 1)
duck = 1 - 0.55 * np.clip(e * 4, 0, 1)                      # ≈ -7 dB under VO
mix = vo * 0.8 + norm(music, 0.8) * 0.64 * duck + hp(sfx, 120) * 0.24
mix = np.tanh(mix * 1.1) / 1.1                              # gentle safety saturation
sf.write('cache/mix_premaster.wav', np.stack([mix, mix], 1).astype(np.float32), SR)
print('wrote cache/mix_premaster.wav', f'{len(cues)} cues')
