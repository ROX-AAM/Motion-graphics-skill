// "Cerussa: the slowest assassin" – Roman cosmetics hidden history, 9:16. drawFrame(t) is pure; shots start on VO words.
const CAP_Y = 400;
const SHAKES = [];
function shakeAt(t) { let x = 0, y = 0; for (const [t0, amp] of SHAKES) { if (t < t0 || t > t0 + 0.5) continue; const k = Math.exp(-(t - t0) * 9) * amp; x += Math.sin(t * 90) * k; y += Math.cos(t * 77) * k; } return [x, y]; }
function camera(ctx, t, s, cx, cy, fn) { const [sx, sy] = shakeAt(t); ctx.save(); ctx.translate(W / 2 + sx, 1150 + sy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore(); }
function camKeys(t, keys) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) { const [a, ...A] = keys[i], [b, ...B] = keys[i + 1]; if (t <= b) { const k = E.inOutCubic(seg(t, a, b)); return A.map((v, j) => lerp(v, B[j], k)); } }
  return keys[keys.length - 1].slice(1);
}
function vignette(ctx, a) { const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.28, W / 2, H * 0.55, H * 0.78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function frame(ctx, a = 1) { meander(ctx, 190, a); meander(ctx, 1730, a); }
const reflectOf = (t, o, s = 0.55) => (ctx) => { ctx.save(); ctx.scale(-s, s); ctx.translate(-40, 260); noblewoman(ctx, t, o); ctx.restore(); };

const SHOTS = [];
function defineShots() {
  const s1 = SEC(1).start, s2 = SEC(2).start, s3 = SEC(3).start;
  const sh = (t0, fn) => SHOTS.push([t0, fn]);

  // ---------- 1: the morning ritual ----------
  const pale = T(0, 'pale'), wealth = T(0, 'wealth,'), morn = T(0, 'So'), cream = T(0, 'cream...'), kill = T(0, 'that', cream);
  sh(0, (ctx, t) => {
    marbleBg(ctx, true); frame(ctx, seg(t, 0, 0.8));
    const [s, cx, cy] = camKeys(t, [[0, 1.0, 540, 1150], [morn, 1.04, 540, 1150], [kill, 1.12, 480, 1180], [s1, 1.16, 480, 1180]]);
    camera(ctx, t, s, cx, cy, () => {
      // intro emblem
      alpha(ctx, 1 - seg(t, pale - 0.2, pale + 0.3), () => at(ctx, 540, 1080, E.outBack(seg(t, 0.15, 0.7), 1.3), 0, () => { laurel(ctx); label(ctx, 'ROMA', 0, 6, 92, R.goldL, { weight: 800 }); }));
      const k = E.outCubic(seg(t, pale - 0.3, pale + 0.6)), powder = E.inOutCubic(seg(t, morn + 1.2, cream + 0.2)), tox = seg(t, kill, kill + 1.2);
      const o = { powder, tox, eye: t > kill ? 'closed' : 'open' };
      at(ctx, lerp(-200, 360, k), 1340, 1.4, 0, () => noblewoman(ctx, t, o));
      at(ctx, lerp(1300, 830, k), 1060, 0.78, 0.05, () => mirror(ctx, t, reflectOf(t, o)));
      // morning light
      alpha(ctx, seg(t, morn, morn + 0.8) * 0.35, () => { ctx.save(); ctx.translate(1000, 500); ctx.rotate(0.5); const g = ctx.createLinearGradient(0, 0, -900, 0); g.addColorStop(0, 'rgba(255,230,160,0.8)'); g.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g; ctx.fillRect(-1200, -60, 1200, 120); ctx.fillRect(-1200, 120, 1200, 70); ctx.restore(); });
      // servant's brush
      if (t > morn + 1.0 && t < cream + 0.6) { const ph = (t - morn) * 2.2; at(ctx, 360 + 80 + Math.sin(ph * Math.PI) * 60, 1340 - 250 + Math.cos(ph * Math.PI * 0.5) * 70, 1, 0, () => brushHand(ctx, t)); puff(ctx, t, 430, 1100, 0.7); }
    });
    at(ctx, 880, 1540, life(t, wealth - 0.1, morn + 0.3, 0.35), 0, () => coinStack(ctx));
    at(ctx, 880, 1540, life(t, cream - 0.15, s1 + 0.4, 0.35) * 0.7, 0, () => pyxis(ctx, t, { open: true, glow: seg(t, kill, kill + 1) }));
    if (t > kill) dust(ctx, t, 26, 'rgba(141,255,110,0.55)');
  });

  // ---------- 2: how cerussa was made ----------
  const ceru = T(1, 'cerussa.'), pure = T(1, 'Pure'), soak = T(1, 'soaking'), vin = T(1, 'vinegar.'), erased = T(1, 'It'), seep = T(1, 'but');
  sh(s1 - 0.05, (ctx, t) => {
    marbleBg(ctx, true); frame(ctx);
    camera(ctx, t, 1 + 0.06 * seg(t, s1, erased), 540, 1300, () => {
      glow(ctx, 540, 1350, 600, 'rgba(141,255,110,0.12)', seg(t, soak, soak + 1));
      at(ctx, 540, 1420, 1, 0, () => claypot(ctx, t, seg(t, soak + 0.3, erased - 0.2), seg(t, soak, soak + 0.8)));
      at(ctx, 540, 1395, pop(t, vin - 0.05, 0.35) * 0.6, 0, () => plaque(ctx, 'ACETUM', 52));
    });
    at(ctx, 540, 680, life(t, ceru - 0.05, pure - 0.1, 0.4), 0, () => plaque(ctx, 'CERUSSA', 84));
    at(ctx, 540, 700, life(t, pure - 0.05, erased, 0.4) * 0.9, 0, () => elementTile(ctx));
  });
  sh(erased - 0.1, (ctx, t) => {
    marbleBg(ctx, true);
    const k = seg(t, erased + 0.6, erased + 1.7);
    camera(ctx, t, 2.0, 520, 1150, () => { at(ctx, 470, 1400, 1.4, 0, () => noblewoman(ctx, t, { blemish: 1 - k, powder: k * 0.92 })); if (t < erased + 1.9) at(ctx, 520 + Math.sin(t * 9) * 50, 1060, 1, 0, () => brushHand(ctx, t)); });
    if (k > 0 && k < 1) puff(ctx, t, 560, 1100, 1);
    at(ctx, 820, 760, pop(t, T(1, 'seconds...') - 0.1, 0.3) * 0.8, 0.1, () => { circle(ctx, 0, 0, 100, R.gold, 0); circle(ctx, 0, 0, 86, '#1a1512', 0); ctx.save(); ctx.rotate(seg(t, T(1, 'seconds...'), seep) * Math.PI * 4); box_(ctx, -5, -70, 10, 74, 5, R.goldL); ctx.restore(); circle(ctx, 0, 0, 10, R.goldL, 0); });
  });
  sh(seep - 0.1, (ctx, t) => {
    marbleBg(ctx, true); frame(ctx);
    at(ctx, 540, 1120, E.outBack(seg(t, seep - 0.1, seep + 0.3), 1.2), 0, () => skinSection(ctx, t, seg(t, seep + 0.4, s2 - 0.6)));
  });

  // ---------- 3: the damage ----------
  const months = T(2, 'months,'), teeth = T(2, 'teeth,'), hair = T(2, 'hair'), scars = T(2, 'scars'), how = T(2, 'And', T(2, 'faces.')), thicker = T(2, 'By'), same = T(2, 'exact');
  sh(s2 - 0.05, (ctx, t) => {
    marbleBg(ctx, true); frame(ctx);
    const thin = E.inOutCubic(seg(t, hair, hair + 2.2)), spots = seg(t, scars - 0.2, scars + 1.4), thick = E.inOutCubic(seg(t, thicker + 0.3, same - 0.2)), tox = 0.15 + 0.85 * seg(t, same - 0.2, same + 0.8);
    const o = { powder: 0.85 - spots * 0.3, spots: spots * (1 - thick * 0.9), thin, thick, tox: t > thicker ? tox : 0.2 * spots, eye: t > how ? 'sad' : 'open' };
    const [s, cx, cy] = camKeys(t, [[s2, 1.05, 520, 1180], [how - 0.1, 1.1, 520, 1180], [how + 0.6, 1.5, 820, 1060], [thicker - 0.1, 1.5, 820, 1060], [thicker + 0.6, 1.3, 440, 1150], [s3, 1.36, 440, 1150]]);
    camera(ctx, t, s, cx, cy, () => {
      at(ctx, 380, 1360, 1.4, 0, () => { noblewoman(ctx, t, o); fallingCurls(ctx, t, hair + 0.1, 7); });
      at(ctx, 840, 1060, 0.78, 0.05, () => mirror(ctx, t, reflectOf(t, o)));
      if (t > thicker + 0.2 && t < same) { const ph = (t - thicker) * 3.2; at(ctx, 470 + Math.sin(ph * Math.PI) * 70, 1080 + Math.cos(ph * Math.PI * 0.5) * 80, 1.1, 0, () => brushHand(ctx, t)); puff(ctx, t, 480, 1080, 0.9); }
    });
    // month counter (Roman numerals)
    const m = 1 + Math.floor(seg(t, months - 0.3, scars + 1.2) * 5.99);
    at(ctx, 540, 640, life(t, months - 0.1, how - 0.1, 0.35) * 0.85, 0, () => plaque(ctx, 'MENSIS ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][m - 1], 64));
    at(ctx, 880, 820, life(t, teeth - 0.1, hair + 1.4, 0.35) * 0.9, 0.1, () => { circle(ctx, 0, 0, 140, 'rgba(13,11,10,0.85)', 0); ctx.beginPath(); ctx.arc(0, 0, 140, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = R.gold; ctx.stroke(); tooth(ctx, seg(t, teeth, teeth + 1.2)); });
    if (t > same - 0.2) dust(ctx, t, 30, 'rgba(141,255,110,0.6)');
  });

  // ---------- 4: the slowest assassin ----------
  const doctors = T(3, 'doctors'), toxic = T(3, 'toxic,'), fashion = T(3, 'fashion'), turning = T(3, 'turning'), slowest = T(3, 'slowest'), empire = T(3, 'empire.');
  sh(s3 - 0.05, (ctx, t) => {
    marbleBg(ctx, true); frame(ctx);
    at(ctx, 250, 1150, E.outBack(seg(t, s3 + 0.05, s3 + 0.55), 1.3), 0, () => asclepius(ctx, t));
    at(ctx, 660, 1100, E.outBack(seg(t, s3 + 0.3, s3 + 0.8), 1.3) * 0.95, -0.03, () => scroll(ctx, [['PLUMBUM', 62], ['VENENUM EST', 50, '#7a1f1f']]));
    at(ctx, 660, 1400, pop(t, toxic - 0.05, 0.35) * 0.45, 0, () => skull(ctx, R.green, 1));
  });
  sh(fashion - 0.1, (ctx, t) => {
    marbleBg(ctx, true); frame(ctx);
    const tilt = -0.28 * E.outBack(seg(t, fashion + 0.4, fashion + 1.3), 1.6);
    at(ctx, 540, 1250, E.outBack(seg(t, fashion - 0.1, fashion + 0.3), 1.2) * 1.05, 0, () => scale_(ctx, t, tilt, () => at(ctx, 0, -60, 1, 0, () => pyxis(ctx, t, {})), () => at(ctx, 0, -60, 1, 0, () => heartIcon(ctx))));
    at(ctx, 230, 1600, pop(t, fashion, 0.3) * 0.9, 0, () => label(ctx, 'FASHION', 0, 0, 44, R.goldL)); at(ctx, 850, 1600, pop(t, T(3, 'survival...') - 0.05, 0.3) * 0.9, 0, () => label(ctx, 'SURVIVAL', 0, 0, 44, R.green));
  });
  sh(turning - 0.1, (ctx, t) => {
    marbleBg(ctx, true); frame(ctx);
    const morph = E.inOutCubic(seg(t, slowest - 0.2, slowest + 0.8)), out = E.inOutCubic(seg(t, empire + 0.2, empire + 1.6));
    const o = { powder: 0.3, thick: 1, spots: 0.2, thin: 0.6, tox: 1, eye: 'sad' };
    at(ctx, lerp(540, 760, out), lerp(1120, 1180, out), lerp(1.45, 0.62, out), 0, () => mirror(ctx, t, (c) => { alpha(c, 1 - morph, () => reflectOf(t, o, 0.75)(c)); alpha(c, morph, () => at(c, 0, 0, 0.9, 0, () => skull(c, R.green, 1))); }));
    at(ctx, 330, 1420, E.outBack(seg(t, empire + 0.4, empire + 1.2), 1.2) * 0.8, 0, () => pyxis(ctx, t, { open: true, glow: 1 }));
    at(ctx, 540, 700, life(t, empire + 1.0, 99, 0.5), 0, () => { label(ctx, 'THE SLOWEST', 0, -40, 78, R.goldL, { weight: 800 }); label(ctx, 'ASSASSIN', 0, 60, 110, R.green, { weight: 900 }); label(ctx, 'CERUSSA · ANCIENT ROME', 0, 150, 34, R.gold, { weight: 600 }); });
    if (t > slowest) dust(ctx, t, 34, 'rgba(141,255,110,0.55)');
  });
  SHOTS.sort((a, b) => a[0] - b[0]);
}

function drawFrame(t) {
  const ctx = CTX; ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  if (!SHOTS.length) defineShots();
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
  const XF = 0.35, k = seg(t, SHOTS[i][0], SHOTS[i][0] + XF);
  if (i > 0 && k < 1) { SHOTS[i - 1][1](ctx, t); alpha(ctx, E.inOutCubic(k), () => SHOTS[i][1](ctx, t)); }
  else SHOTS[i][1](ctx, t);
  vignette(ctx, 0.6);
  captions(ctx, t, CAP_Y, { size: 82 });
  const end = BEATS.duration; alpha(ctx, seg(t, end - 0.9, end - 0.1), () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
}

// ---------- SFX cues ----------
function buildCues() {
  if (!SHOTS.length) defineShots();
  const q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  SHOTS.slice(1).forEach(([t0]) => add(t0 - 0.15, 'whoosh', 0.3));
  add(0.15, 'chime', 0.5); add(T(0, 'pale') - 0.2, 'swoosh', 0.4); add(T(0, 'wealth,') - 0.1, 'cash', 0.5);
  add(T(0, 'So') + 1.0, 'brush', 0.5, { dur: T(0, 'cream...') - T(0, 'So') - 0.4 }); add(T(0, 'cream...') - 0.15, 'pop', 0.4);
  add(T(0, 'that', T(0, 'cream...')), 'boom', 0.5); add(T(0, 'that', T(0, 'cream...')) + 0.1, 'drone', 0.4, { dur: 2.2 });
  add(T(1, 'cerussa.') - 0.05, 'chime', 0.6); add(T(1, 'Pure') - 0.05, 'clank', 0.5); add(T(1, 'soaking'), 'bubble', 0.5, { dur: T(1, 'It') - T(1, 'soaking') });
  add(T(1, 'It') + 0.6, 'brush', 0.5, { dur: 1.2 }); add(T(1, 'seconds...') - 0.1, 'tick', 0.5); add(T(1, 'seconds...') + 0.4, 'tick', 0.4);
  add(T(1, 'but') - 0.1, 'boom', 0.45); add(T(1, 'but') + 0.4, 'drone', 0.45, { dur: 3 });
  add(T(2, 'months,') - 0.1, 'chime', 0.4); add(T(2, 'teeth,') - 0.1, 'crack', 0.6); add(T(2, 'hair'), 'swoosh', 0.3); add(T(2, 'scars') - 0.1, 'boom', 0.4);
  add(T(2, 'And', T(2, 'faces.')) + 0.1, 'swoosh', 0.35); add(T(2, 'By') + 0.3, 'brush', 0.6, { dur: T(2, 'exact') - T(2, 'By') - 0.4 }); add(T(2, 'exact') - 0.2, 'rise', 0.45); add(T(2, 'poison.'), 'boom', 0.6);
  add(T(3, 'doctors') - 0.2, 'swoosh', 0.4); add(T(3, 'toxic,') - 0.05, 'pop', 0.5); add(T(3, 'fashion') + 0.4, 'thud', 0.6); add(T(3, 'fashion') + 0.5, 'clank', 0.4);
  add(T(3, 'slowest') - 0.3, 'rise', 0.5); add(T(3, 'slowest') + 0.7, 'boom', 0.8); add(T(3, 'empire.') + 1.0, 'chime', 0.5);
  return q.sort((a, b) => a.t - b.t);
}
function initShakes() { SHAKES.push([T(3, 'slowest') + 0.7, 8]); }
