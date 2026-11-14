// "Lake Nyos, 1986" – the silent killer. 9:16, drawFrame(t) pure; shots start on VO words; soft cross-dissolves.
const CAP_Y = 400;
const SHAKES = [];
function shakeAt(t) { let x = 0, y = 0; for (const [t0, amp] of SHAKES) { if (t < t0 || t > t0 + 0.6) continue; const k = Math.exp(-(t - t0) * 7) * amp; x += Math.sin(t * 90) * k; y += Math.cos(t * 77) * k; } return [x, y]; }
function camera(ctx, t, s, cx, cy, fn) { const [sx, sy] = shakeAt(t); ctx.save(); ctx.translate(W / 2 + sx, 1150 + sy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore(); }
function camKeys(t, keys) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) { const [a, ...A] = keys[i], [b, ...B] = keys[i + 1]; if (t <= b) { const k = E.inOutCubic(seg(t, a, b)); return A.map((v, j) => lerp(v, B[j], k)); } }
  return keys[keys.length - 1].slice(1);
}
function vignette(ctx, a) { const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.28, W / 2, H * 0.55, H * 0.78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function pill(ctx, s, col = '#cfe3ee', bg = 'rgba(8,16,24,0.85)', size = 46) { ctx.font = `${size}px Anton`; const w = ctx.measureText(s).width + 70; bx(ctx, -w / 2, -size * 0.8, w, size * 1.6, size * 0.8, bg); lbl(ctx, s, 0, 3, size, col); }
// cloud path from the lake down the valley into the village
function cloudPts(k, t) { const pts = []; for (let i = 0; i < 9; i++) { const u = clamp(k * 1.25 - i * 0.03); const x = lerp(260, 900, u) + Math.sin(t + i) * 15 - i * 30, y = lerp(980, 1390, u * u) - 30 + (i % 3) * 25; pts.push([x, y, 70 + i * 6 + u * 40]); } return pts; }

const SHOTS = [];
function defineShots() {
  const s1 = SEC(1).start, s2 = SEC(2).start, s3 = SEC(3).start, s4 = SEC(4).start;
  const sh = (t0, fn) => SHOTS.push([t0, fn]);

  // ---------- HOOK: a peaceful night ----------
  const never = T(0, 'never'), dis = T(0, 'disease,'), eq = T(0, 'earthquake,'), air = T(0, 'air'), deadly = T(0, 'deadly.');
  sh(0, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141b26'); g.addColorStop(1, '#22202a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    camera(ctx, t, 1 + 0.06 * seg(t, 0, s1), 540, 1250, () => {
      at(ctx, 540, 860, 1, 0, () => windowNight(ctx, t, 340, 400));
      softGlow(ctx, 540, 900, 520, 'rgba(120,160,220,0.18)');
      bx(ctx, -100, 1560, 1300, 600, 0, '#1a1612');
      at(ctx, 560, 1520, 1.3, 0, () => sleeper(ctx, t, { breathe: 1 - seg(t, never, never + 1.5) * 0.8 }));
      const bad = seg(t, air, air + 1.6);
      airParticles(ctx, t, 50, bad > 0.5 ? 'rgba(200,235,190,0.8)' : 'rgba(150,200,255,0.6)', 0.6, [0, 500, W, 1200]);
      if (bad) gasCloud(ctx, t, [[200, 1600, 140], [450, 1640, 160], [720, 1620, 150], [950, 1600, 140]].map(([x, y, r]) => [x, y - bad * 120, r * (0.6 + bad * 0.6)]), bad);
    });
    at(ctx, 300, 760, life(t, dis - 0.2, air, 0.35) * 0.85, 0, () => { virusIcon(ctx); if (t > dis + 0.2) crossIcon(ctx, 120); });
    at(ctx, 780, 760, life(t, eq - 0.2, air, 0.35) * 0.85, 0, () => { quakeIcon(ctx); if (t > eq + 0.25) crossIcon(ctx, 120); });
    alpha(ctx, seg(t, deadly - 0.3, deadly + 0.3) * 0.25, () => { ctx.fillStyle = '#ff2d20'; ctx.fillRect(0, 0, W, H); });
  });

  // ---------- 1: August 1986, Cameroon ----------
  const nyos = T(1, 'Nyos,'), bed = T(1, 'went'), but1 = T(1, 'But'), beneath = T(1, 'beneath');
  sh(s1 - 0.05, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1426'); g.addColorStop(1, '#122638'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const z = E.inOutCubic(seg(t, nyos + 0.4, bed));
    camera(ctx, t, lerp(1.35, 2.6, z), lerp(540, 520, z), lerp(1100, 1020, z), () => {
      at(ctx, 540, 1150, E.outBack(seg(t, s1, s1 + 0.6), 1.2), 0, () => africa(ctx));
      at(ctx, 545, 1080, pop(t, nyos - 0.1, 0.35) * 0.55, 0, () => pin(ctx));
    });
    at(ctx, 540, 1640, pop(t, T(1, 'August,') - 0.05, 0.35), 0, () => pill(ctx, 'AUGUST 21, 1986', '#ffd166'));
    at(ctx, 540, 760, pop(t, nyos - 0.05, 0.35), 0, () => pill(ctx, 'LAKE NYOS · CAMEROON', '#5fe0d0', 'rgba(8,16,24,0.85)', 50));
  });
  sh(bed - 0.1, (ctx, t) => {
    const [s, cx, cy] = camKeys(t, [[bed, 1.0, 560, 1200], [but1, 1.05, 560, 1200], [beneath, 1.6, 280, 1020]]);
    camera(ctx, t, s, cx, cy, () => {
      landscape(ctx, t);
      const L = [0, 1, 2, 3, 4, 5].map(i => 1 - seg(t, bed + 0.3 + i * 0.25, bed + 0.45 + i * 0.25));
      village(ctx, t, L);
      softGlow(ctx, 250, 1000, 260, 'rgba(184,240,160,0.25)', seg(t, but1, but1 + 1.5));
    });
  });
  sh(beneath - 0.05, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1426'); g.addColorStop(1, '#16304a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const gas = seg(t, s2, T(2, 'pressure.') + 0.6) * 0.8 + 0.2;
    camera(ctx, t, 1.0, 540, 1150, () => at(ctx, 540, 900, 1, 0, () => lakeSection(ctx, t, gas)));
    at(ctx, 860, 700, pop(t, T(2, 'under') - 0.1, 0.35) * 0.9, 0, () => gauge(ctx, seg(t, T(2, 'under'), T(2, 'pressure.') + 1.2) * 0.95));
    at(ctx, 470, 1600, pop(t, T(2, 'carbon') - 0.05, 0.35), 0, () => at(ctx, 0, 0, 1.6, 0, () => { co2Mol(ctx); lbl(ctx, 'CO₂', 120, 0, 56, '#b8f0a0', { align: 'left' }); }));
  });

  // ---------- 2: the eruption ----------
  const sud = T(2, 'Suddenly,'), erupt = T(2, 'erupted'), roll = T(2, 'rolled');
  sh(sud - 0.05, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1426'); g.addColorStop(1, '#16304a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    camera(ctx, t, 1.0, 540, 1150, () => at(ctx, 540, 900, 1, 0, () => lakeSection(ctx, t, 1, { rise: seg(t, sud, sud + 0.4) })));
    at(ctx, 860, 700, 0.9, 0, () => gauge(ctx, 0.98 + Math.sin(t * 40) * 0.02));
  });
  sh(erupt - 0.1, (ctx, t) => {
    const [s, cx, cy] = camKeys(t, [[erupt, 1.35, 400, 1080], [roll, 1.35, 400, 1080], [roll + 1.2, 1.05, 560, 1200]]);
    camera(ctx, t, s, cx, cy, () => {
      landscape(ctx, t); village(ctx, t, [0, 0, 0, 0, 0, 0]);
      // fountain column from the lake
      const f = seg(t, erupt - 0.1, erupt + 0.5) * (1 - seg(t, roll + 1.5, roll + 3));
      if (f) { for (let i = 0; i < 30; i++) { const ph = i / 30, k = (t * 1.2 + ph) % 1; alpha(ctx, f * (1 - k), () => circle(ctx, 250 + Math.sin(i * 7) * 70 * k, 980 - 520 * Math.sin(k * Math.PI * 0.9) * f, 14 + k * 30, i % 3 ? 'rgba(200,235,255,0.8)' : 'rgba(200,235,190,0.7)', 0)); } }
      gasCloud(ctx, t, cloudPts(seg(t, roll - 0.3, roll + 3.2), t), seg(t, erupt, erupt + 0.6));
    });
    at(ctx, 540, 1660, pop(t, roll + 2.0, 0.35), 0, () => pill(ctx, 'CO₂ IS HEAVIER THAN AIR', '#b8f0a0'));
  });

  // ---------- 3: no oxygen ----------
  const disp = T(3, 'displaced'), people = T(3, 'People'), slept = T(3, 'slept.'), morning = T(3, 'By'), num = T(3, '1,700'), animals = T(3, 'thousands');
  sh(s3 - 0.05, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1824'); g.addColorStop(1, '#14283a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const k = E.inOutCubic(seg(t, disp, disp + 2.0));
    const r = rng(12);
    for (let i = 0; i < 14; i++) { const x = 120 + r() * 560, y = 700 + r() * 900, ph = r() * 6; at(ctx, x + Math.sin(t + ph) * 12 + k * (x - 100) * 0.2, y - k * (y - 300) * 1.3, 0.9, t * 0.5 + ph, () => alpha(ctx, 1 - k * 0.8, () => o2Mol(ctx))); }
    for (let i = 0; i < 16; i++) { const x = 100 + r() * 600, y = 1000 + r() * 650, ph = r() * 6; at(ctx, x + Math.sin(t * 0.8 + ph) * 10 - (1 - k) * 800, y + (1 - k) * 200, 0.8, ph, () => alpha(ctx, k, () => co2Mol(ctx))); }
    at(ctx, 900, 1150, 0.9, 0, () => o2Meter(ctx, lerp(1, 0.25, k)));
  });
  sh(people - 0.1, (ctx, t) => {
    ctx.fillStyle = '#100d0b'; ctx.fillRect(0, 0, W, H);
    camera(ctx, t, 1.05, 540, 1250, () => {
      bx(ctx, -100, 1480, 1300, 700, 0, '#1a1410');
      at(ctx, 560, 1460, 1.25, 0, () => sleeper(ctx, t, { breathe: 0, blanket: '#2f4a5a' }));
      const fl = 1 - seg(t, people + 0.6, people + 1.6);
      at(ctx, 880, 1330, 1.1, 0, () => oilLamp(ctx, t, fl));
      gasCloud(ctx, t, [[150, 1500, 160], [420, 1520, 170], [700, 1500, 170], [950, 1520, 160]], 0.8);
    });
    alpha(ctx, 0.35, () => { ctx.fillStyle = '#05080c'; ctx.fillRect(0, 0, W, H); });
  });
  sh(morning - 0.1, (ctx, t) => {
    camera(ctx, t, 1.0, 560, 1200, () => { landscape(ctx, t, { dawn: seg(t, morning - 0.1, morning + 1.2) }); village(ctx, t, [0, 0, 0, 0, 0, 0]); });
    alpha(ctx, 0.3, () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
    // memorial counter
    const k = seg(t, num - 0.2, num + 1.2);
    at(ctx, 540, 760, pop(t, num - 0.25, 0.35), 0, () => { bx(ctx, -400, -230, 800, 460, 30, 'rgba(8,12,18,0.82)');
      for (let i = 0; i < 60; i++) at(ctx, -330 + (i % 15) * 47, -150 + Math.floor(i / 15) * 62, 0.85, 0, () => alpha(ctx, i / 60 < k ? 1 : 0.15, () => personIcon(ctx, '#cfd6de')));
      lbl(ctx, Math.round(1746 * k).toLocaleString('en-US'), 0, 140, 100, '#ff5a4f'); });
    at(ctx, 540, 1150, pop(t, animals - 0.1, 0.35), 0, () => { bx(ctx, -400, -90, 800, 180, 30, 'rgba(8,12,18,0.82)'); for (let i = 0; i < 6; i++) at(ctx, -300 + i * 120, 20, 0.8, 0, () => cowIcon(ctx, '#9aa6b2')); lbl(ctx, '+ THOUSANDS OF ANIMALS', 0, -50, 40, '#cfe3ee'); });
  });

  // ---------- 4: invisible killer, the pipes, the secret ----------
  const killer = T(4, 'killer'), inv = T(4, 'invisible.'), sci = T(4, 'Scientists'), but4 = T(4, 'But'), secret = T(4, 'deadly');
  sh(s4 - 0.05, (ctx, t) => {
    camera(ctx, t, 1.1, 520, 1150, () => { landscape(ctx, t); village(ctx, t, [1, 1, 1, 1, 1, 1]); gasCloud(ctx, t, cloudPts(1, t), 1 - seg(t, inv - 0.2, inv + 0.6), true); });
    at(ctx, 540, 760, pop(t, inv + 0.1, 0.35), 0, () => pill(ctx, 'NO COLOR · NO SMELL', '#b8f0a0'));
  });
  sh(sci - 0.1, (ctx, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1426'); g.addColorStop(1, '#16304a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const inst = E.outCubic(seg(t, T(4, 'installed') - 0.2, T(4, 'installed') + 0.6)), flow = seg(t, T(4, 'release') - 0.2, T(4, 'release') + 0.4);
    camera(ctx, t, 1.0, 540, 1150, () => at(ctx, 540, 900, 1, 0, () => { lakeSection(ctx, t, lerp(0.9, 0.35, seg(t, T(4, 'release'), but4 + 0.3))); at(ctx, 0, lerp(-600, 0, inst), 1, 0, () => pipeFountain(ctx, t, flow)); }));
    at(ctx, 860, 700, 0.9, 0, () => gauge(ctx, lerp(0.95, 0.35, seg(t, T(4, 'release'), but4 + 0.3))));
    at(ctx, 540, 1640, pop(t, T(4, 'pipes') - 0.05, 0.35), 0, () => pill(ctx, 'DEGASSING PIPES · SINCE 2001', '#5fe0d0'));
  });
  sh(but4 - 0.1, (ctx, t) => {
    const [s, cx, cy] = camKeys(t, [[but4, 1.1, 420, 1080], [BEATS.duration, 1.55, 300, 1000]]);
    camera(ctx, t, s, cx, cy, () => { landscape(ctx, t, { lakeCol: '#24677a' }); village(ctx, t, [1, 1, 0, 1, 1, 0]); softGlow(ctx, 250, 1010, 220, 'rgba(184,240,160,0.55)', seg(t, secret - 0.2, secret + 0.8) * (0.7 + 0.3 * Math.sin(t * 3))); });
    at(ctx, 540, 760, life(t, secret + 0.6, 99, 0.5), 0, () => { bx(ctx, -420, -110, 840, 220, 30, 'rgba(8,12,18,0.82)'); lbl(ctx, 'LAKE NYOS · AUGUST 21, 1986', 0, -32, 50, '#ffd166'); lbl(ctx, 'IN MEMORY OF THE 1,746 LIVES LOST', 0, 44, 38, '#cfe3ee'); });
  });
  SHOTS.sort((a, b) => a[0] - b[0]);
}

function drawFrame(t) {
  const ctx = CTX; ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  if (!SHOTS.length) defineShots();
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
  const k = seg(t, SHOTS[i][0], SHOTS[i][0] + 0.35);
  if (i > 0 && k < 1) { SHOTS[i - 1][1](ctx, t); alpha(ctx, E.inOutCubic(k), () => SHOTS[i][1](ctx, t)); } else SHOTS[i][1](ctx, t);
  vignette(ctx, 0.55);
  captions(ctx, t, CAP_Y, { size: 96 });
  const end = BEATS.duration; alpha(ctx, seg(t, end - 0.6, end - 0.05), () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
}

function buildCues() {
  if (!SHOTS.length) defineShots();
  const q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  SHOTS.slice(1).forEach(([t0]) => add(t0 - 0.15, 'whoosh', 0.25));
  const s2 = SEC(2).start, s3 = SEC(3).start;
  add(0, 'crickets', 0.35, { dur: SEC(1).start + 4 });
  add(T(0, 'disease,') + 0.2, 'error', 0.4); add(T(0, 'earthquake,') + 0.25, 'error', 0.4); add(T(0, 'air'), 'drone', 0.4, { dur: 3 }); add(T(0, 'deadly.'), 'boom', 0.6);
  add(T(1, 'Nyos,') - 0.1, 'pop', 0.5); add(T(1, 'August,'), 'tick', 0.4);
  for (let i = 0; i < 6; i++) add(T(1, 'went') + 0.35 + i * 0.25, 'click', 0.25);
  add(T(1, 'But'), 'drone', 0.45, { dur: 4 }); add(T(1, 'beneath'), 'water', 0.5, { dur: 7 });
  add(T(2, 'under'), 'rise', 0.4); add(T(2, 'Suddenly,'), 'bubble', 0.7, { dur: 1.3 }); add(T(2, 'erupted') - 0.1, 'boom', 1.0); add(T(2, 'erupted'), 'gush', 0.7, { dur: 3 });
  add(T(2, 'rolled'), 'wind', 0.55, { dur: s3 - T(2, 'rolled') + 1 });
  add(T(3, 'displaced'), 'drone', 0.4, { dur: 2.5 }); add(T(3, 'People') + 0.9, 'snuff', 0.6);
  add(T(3, 'By') - 0.1, 'chime', 0.3); add(T(3, '1,700') - 0.25, 'pop', 0.4); add(T(3, 'thousands') - 0.1, 'pop', 0.35);
  add(T(4, 'invisible.'), 'boom', 0.5); add(T(4, 'installed') - 0.2, 'clank', 0.4); add(T(4, 'release') - 0.2, 'gush', 0.4, { dur: 3 });
  add(T(4, 'But'), 'crickets', 0.25, { dur: BEATS.duration - T(4, 'But') }); add(T(4, 'deadly') - 0.1, 'boom', 0.5);
  return q.sort((a, b) => a.t - b.t);
}
function initShakes() { SHAKES.push([T(2, 'erupted') - 0.1, 16], [T(2, 'Suddenly,'), 8]); }
