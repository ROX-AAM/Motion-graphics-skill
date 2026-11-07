// Scenes for "One quick check" (60 s, 9:16). drawFrame(t) is pure: same t → same frame.
const BOUNDS = [8, 18, 30, 42, 52];
const CAP_Y = 470;

// ---------- shared backgrounds ----------
const STARS = (() => { const r = rng(42); return Array.from({ length: 70 }, () => ({ x: r() * W, y: 120 + r() * 1300, s: 4 + r() * 9, p: r() * 6 })); })();
function nightSky(ctx, t, c1 = C.night1, c2 = C.night2, starA = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c2); g.addColorStop(1, c1);
  ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
  alpha(ctx, starA, () => STARS.forEach(s => alpha(ctx, 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + s.p)), () => sparkle(ctx, s.x, s.y, s.s, '#fff3c4'))));
}
function vignette(ctx, a = 0.45) {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.75);
  g.addColorStop(0, 'rgba(10,6,30,0)'); g.addColorStop(1, `rgba(10,6,30,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
const SHAKES = [];
function shakeAt(t) { let x = 0, y = 0; for (const [t0, amp] of SHAKES) { if (t < t0 || t > t0 + 0.5) continue; const k = Math.exp(-(t - t0) * 9) * amp; x += Math.sin(t * 90) * k; y += Math.cos(t * 77) * k; } return [x, y]; }
function camera(ctx, t, s, cx, cy, fn) { const [sx, sy] = shakeAt(t); ctx.save(); ctx.translate(cx + sx, cy + sy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore(); }

function bedroom(ctx, t, o = {}) {
  nightSky(ctx, t, o.wall1 || '#3b2d7a', o.wall2 || '#1d1546', 0.5);
  // wall star wallpaper
  alpha(ctx, 0.12, () => { for (let i = 0; i < 30; i++) star(ctx, (i % 5) * 240 + (Math.floor(i / 5) % 2) * 120, 200 + Math.floor(i / 5) * 230, 22, '#fff', 0); });
  at(ctx, 250, 880, 1, 0, () => windowFrame(ctx, t, 360, 400, o.sky || ['#0e0b33', '#2c2a7a'], () => {
    if (o.windowInner) o.windowInner(); else { at(ctx, 50, -70, 1, 0, () => moon(ctx, t, 62)); for (let i = 0; i < 6; i++) sparkle(ctx, -130 + i * 50, 40 + (i % 3) * 40, 8, '#fff3c4'); }
  }));
}
function bedWithKid(ctx, t, kidOpts, o = {}) {
  at(ctx, 560, 1340, 0.86, 0, () => bedBack(ctx));
  at(ctx, 560, 1222, o.headS || 0.95, o.headRot || 0, () => kid(ctx, t, kidOpts));
  at(ctx, 560, 1340, 0.86, 0, () => blanket(ctx, t, 40, o.breathe || 0));
}

// ---------- scene 1: the plan (0–8) ----------
function scene1(ctx, t) {
  const sleepT = T(0, 'restorative'), lampOff = seg(t, T(0, 'sleep,'), T(0, 'sleep,') + 0.3);
  camera(ctx, t, 1.1 + 0.05 * E.inOutCubic(seg(t, 0, 8)), 540, 1180, () => {
    bedroom(ctx, t);
    const closed = t > sleepT;
    bedWithKid(ctx, t, { eyes: closed ? 'closed' : 'open', mouth: closed ? 'smile' : t > T(0, 'No') ? 'smug' : 'grin', look: [0.4, -0.5], blink: t < sleepT ? Math.max(0, 1 - Math.abs(t - 1.6) * 12) : 0 }, { breathe: closed ? 1 : 0 });
    // nightstand + face-down phone
    at(ctx, 130, 1250, 1, 0, () => {
      nightstand(ctx, t, 1 - lampOff);
      at(ctx, 40, -14, 1, 0, () => { rr(ctx, -10, -10, 120, 24, 8); paint(ctx, '#2b2b44', 6); });
      at(ctx, 100, -60, pop(t, T(0, 'No'), 0.35), 0, () => { circle(ctx, 0, 0, 92, 'rgba(255,255,255,0.85)', 0); noSign(ctx, 80); });
    });
    alpha(ctx, lampOff * 0.25, () => { ctx.fillStyle = '#0a0626'; ctx.fillRect(-100, -100, W + 200, H + 200); });
    if (closed) zzz(ctx, 690, 1120, t, seg(t, sleepT, sleepT + 0.4));
    // 8 HRS sticker
    at(ctx, 810, 900, life(t, T(0, '8'), T(0, 'fresh') - 0.1, 0.4), wob(t, 0.6, 0.06), () => { burst(ctx, 0, 0, 150, C.yellow, 16); text(ctx, '8', 0, -22, 120, C.pink, { lw: 18 }); text(ctx, 'HRS', 0, 62, 56, C.white, { lw: 12 }); });
    // dream bubble: sunny tomorrow
    at(ctx, 770, 930, life(t, T(0, 'fresh'), 8.2, 0.45), 0, () => thought(ctx, t, 400, 300, () => {
      ctx.fillStyle = '#9fe2ff'; ctx.fillRect(-250, -200, 500, 400);
      ctx.fillStyle = '#6fd37a'; ctx.beginPath(); ctx.ellipse(0, 150, 260, 110, 0, 0, Math.PI * 2); ctx.fill();
      at(ctx, 0, -10, 0.62, 0, () => sun(ctx, t, 90, 'happy'));
      for (let i = 0; i < 4; i++) sparkle(ctx, -140 + i * 95, -90 + (i % 2) * 140, 14 + 6 * Math.sin(t * 6 + i), '#fff');
    }));
  });
}

// ---------- scene 2: just one quick check (8–18) ----------
function scene2(ctx, t) {
  const grab = T(1, 'check.');
  if (t < grab) { // wide: phone buzzing, kid peeks
    camera(ctx, t, 1.05, 540, 1100, () => {
      bedroom(ctx, t);
      bedWithKid(ctx, t, { eyes: t > 8.2 ? 'peek' : 'closed', look: [-1, 0.4], mouth: 'flat' });
      at(ctx, 130, 1250, 1, 0, () => {
        nightstand(ctx, t, 0);
        const bz = Math.sin(t * 80) * 6;
        at(ctx, 40 + bz, -14, 1, Math.sin(t * 70) * 0.05, () => { alpha(ctx, 0.8, () => circle(ctx, 60, 0, 90, 'rgba(110,230,255,0.45)', 0)); rr(ctx, -10, -10, 120, 24, 8); paint(ctx, '#2b2b44', 6); });
        ctx.strokeStyle = C.cyan; ctx.lineWidth = 8; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(100, -10, 70 + i * 26, s > 0 ? -0.6 : Math.PI - 0.1, s > 0 ? 0.1 : Math.PI + 0.6); ctx.stroke(); }
      });
      alpha(ctx, 0.25, () => { ctx.fillStyle = '#0a0626'; ctx.fillRect(-100, -100, W + 200, H + 200); });
    });
    return;
  }
  // close-up: sitting up, phone glow
  const k = E.outCubic(seg(t, grab, grab + 0.35));
  const em = T(1, 'emergency,'), cr = T(1, 'critical.'), ten = T(1, '10'), mx = T(1, 'max.');
  const flash = t > em && t < cr + 1.4 ? (Math.floor(t * 6) % 2 ? 'rgba(255,71,87,0.16)' : 'rgba(54,226,255,0.14)') : null;
  camera(ctx, t, lerp(1.55, 1.3, k) + 0.04 * seg(t, grab, 18), 540, 1180, () => {
    nightSky(ctx, t, '#2a2470', '#110c35', 0.4);
    at(ctx, 540, 1180, 1, 0, () => torso(ctx, t, [-70, 220], [70, 220]));
    at(ctx, 540, 1010, 1.1, wob(t, 0.4, 0.03), () => kid(ctx, t, { eyes: t > mx ? 'peek' : 'wide', look: [0, 0.8], mouth: t > mx ? 'smug' : t > em ? 'o' : 'flat', glow: 1 }));
    at(ctx, 540, 1430, 1, 0, () => { phone(ctx, t, 230, 380, { glow: 0.9 }); hand(ctx, -90, -30); hand(ctx, 90, -30); });
    if (flash) { ctx.fillStyle = flash; ctx.fillRect(-100, -100, W + 200, H + 200); }
  });
  at(ctx, 200, 880, life(t, em - 0.05, cr + 1.4, 0.4), wob(t, 1.2, 0.08), () => siren(ctx, t));
  at(ctx, 880, 880, life(t, cr - 0.05, ten - 0.1, 0.4), wob(t, 1.5, 0.1), () => warning(ctx));
  at(ctx, 860, 880, life(t, ten - 0.05, 18, 0.4), 0, () => stopwatch(ctx, t, seg(t, ten, ten + 10) * 1));
  at(ctx, 220, 900, pop(t, mx, 0.3), 0, () => stamp(ctx, 'MAX!', C.pink, 110));
}

// ---------- scene 3: the otter hole (18–30) ----------
function otterScreen(ctx, t, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fe2ff'); g.addColorStop(1, '#d6f4ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  water(ctx, t, w, h * 0.52);
  const dr = T(2, 'drift'), apart = Math.sin(seg(t, dr, dr + 0.9) * Math.PI) * 50;
  at(ctx, w / 2 - 120 - apart, h * 0.6, 0.62, -0.08, () => otter(ctx, t, -1, 0));
  at(ctx, w / 2 + 120 + apart, h * 0.6 + 6, 0.62, 0.08, () => otter(ctx, t, 1, 1.3));
  // held paws
  circle(ctx, w / 2, h * 0.6 - 92 + Math.sin(t * 2) * 5, 18, '#9a6a45', 6);
  for (let i = 0; i < 5; i++) { const k = (t * 0.35 + i / 5) % 1; alpha(ctx, Math.sin(k * Math.PI), () => heart(ctx, w / 2 + Math.sin(i * 2 + t) * 120, h * 0.48 - k * 300, 0.5 + 0.2 * (i % 2))); }
  text(ctx, '@otterfacts', 30, h - 150, 34, '#fff', { align: 'left', lw: 8 });
  text(ctx, 'they hold hands so they don’t drift apart ♥', 30, h - 104, 24, '#fff', { align: 'left', lw: 6, font: 'Fredoka', weight: 600 });
}
function jellyScreen(ctx, t, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b2b7a'); g.addColorStop(1, '#0a1240'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 3; i++) at(ctx, w * (0.25 + i * 0.25), h * (0.4 + 0.12 * Math.sin(t * 1.5 + i)), 0.8 - i * 0.12, 0, () => {
    ctx.beginPath(); ctx.arc(0, 0, 90, Math.PI, 0); ctx.quadraticCurveTo(60, 30, 0, 20); ctx.quadraticCurveTo(-60, 30, -90, 0); paint(ctx, i % 2 ? C.lilac : C.pink, 7);
    ctx.strokeStyle = i % 2 ? C.lilac : C.pink; ctx.lineWidth = 8; for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(j * 28, 20); ctx.quadraticCurveTo(j * 28 + 20 * Math.sin(t * 3 + j), 90, j * 28, 160); ctx.stroke(); }
  });
  text(ctx, 'do jellyfish sleep??', w / 2, h - 130, 48, '#fff', { lw: 10 });
}
function shipScreen(ctx, t, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffcf8a'); g.addColorStop(1, '#ff9f7a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  water(ctx, t, w, h * 0.6, '#2c6fd6', '#7fb4ff');
  at(ctx, w / 2, h * 0.6, 0.75, 0, () => ship(ctx, t));
  text(ctx, 'how 1700s ships were built', w / 2, h - 130, 40, '#fff', { lw: 10 });
}
function scene3(ctx, t) {
  const ffEnd = T(2, 'and');
  if (t < ffEnd) { // fast-forward
    camera(ctx, t, 1 + 0.04 * seg(t, 18, ffEnd), 540, 1000, () => {
      nightSky(ctx, t, '#2f2580', '#120d3a', 0.6);
      speedLines(ctx, t, 540, 1050, 0.9);
      const spin = (t - 18) * 14;
      at(ctx, 540, 1000, pop(t, 18.02, 0.35) * 1.5, 0, () => wallClock(ctx, t, spin / 12 + 0.6, spin));
      at(ctx, 540, 1430, 0.7, 0, () => { torso(ctx, t, [-60, 200], [60, 200]); });
      at(ctx, 540, 1290, 0.75, 0, () => kid(ctx, t, { eyes: 'wide', look: [0, 1], mouth: 'flat', glow: 1 }));
      at(ctx, 540, 1580, 0.7, 0, () => { phone(ctx, t, 220, 360, { glow: 1 }); hand(ctx, -90, -30); hand(ctx, 90, -30); });
    });
    // VHS overlay
    alpha(ctx, 0.12, () => { ctx.fillStyle = '#000'; for (let y = (t * 300) % 8; y < H; y += 8) ctx.fillRect(0, y, W, 3); });
    alpha(ctx, Math.floor(t * 4) % 2 ? 1 : 0.6, () => { text(ctx, '▶▶ x16', 70, 280, 72, C.white, { align: 'left', lw: 12 }); });
    at(ctx, 820, 1330, pop(t, T(2, '3'), 0.3), -0.12, () => { burst(ctx, 0, 0, 120, C.cyan, 14); text(ctx, '+3', 0, -14, 80, C.ink, { lw: 0 }); text(ctx, 'MIN', 0, 44, 40, C.ink, { lw: 0 }); });
    return;
  }
  // phone fills the frame
  const k = E.outBack(seg(t, ffEnd, ffEnd + 0.45), 1.2), sw1 = 27.3, sw2 = 28.7;
  camera(ctx, t, 1, 540, 1100, () => {
    nightSky(ctx, t, '#2f2580', '#120d3a', 0.5);
    alpha(ctx, 0.5, () => { const g = ctx.createRadialGradient(540, 1120, 100, 540, 1120, 700); g.addColorStop(0, 'rgba(110,230,255,0.5)'); g.addColorStop(1, 'rgba(110,230,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
    at(ctx, 540, lerp(1700, 1160, k), lerp(0.4, 1, k), 0, () => {
      phone(ctx, t, 580, 960, { screen: (c, w, h) => {
        const s1 = E.inOutCubic(seg(t, sw1, sw1 + 0.35)), s2 = E.inOutCubic(seg(t, sw2, sw2 + 0.35));
        c.save(); c.translate(0, -(s1 + s2) * h);
        otterScreen(c, t, w, h); c.translate(0, h); jellyScreen(c, t, w, h); c.translate(0, h); shipScreen(c, t, w, h); c.restore();
        // UI column
        for (let i = 0; i < 3; i++) { circle(c, w - 60, h * 0.45 + i * 100, 34, 'rgba(255,255,255,0.85)', 5); }
        heart(c, w - 60, h * 0.45 + 2, 0.45, C.pink, 4);
        rr(c, 24, h - 40, w - 48, 10, 5); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill(); rr(c, 24, h - 40, (w - 48) * (((t - ffEnd) / 6) % 1), 10, 5); c.fillStyle = '#fff'; c.fill();
      } });
      hand(ctx, -300, 150); hand(ctx, 300, 150);
    });
  });
  // reaction-cam bubble: deeply invested
  at(ctx, 200, 1420, life(t, T(2, 'deeply') - 0.05, 27.2, 0.4), 0, () => {
    circle(ctx, 0, 0, 150, '#2a2470', 10);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 145, 0, Math.PI * 2); ctx.clip(); at(ctx, 0, 40, 0.95, 0, () => kid(ctx, t, { eyes: 'wide', veins: 1, look: [0.6, 0.2], mouth: t > T(2, 'hold') ? 'grin' : 'o', glow: 1 })); ctx.restore();
    circle(ctx, 0, 0, 150, null, 10);
  });
  at(ctx, 540, 600, life(t, 27.8, 30.2, 0.3), -0.05, () => { rr(ctx, -250, -50, 500, 100, 50); paint(ctx, C.yellow, 8); text(ctx, 'VIDEO 47 OF ∞', 0, 4, 52, C.ink, { lw: 0 }); });
}

// ---------- scene 4: the math (30–42) ----------
function scene4(ctx, t) {
  const right = T(3, 'right?', 40), med = T(3, 'medically');
  const zoom = E.inOutCubic(seg(t, right - 0.1, right + 0.5));
  const panic = seg(t, 30.1, 34);
  camera(ctx, t, 1 + 0.35 * zoom, 540, 1060, () => {
    bedroom(ctx, t, { wall1: '#342874', wall2: '#1a1342' });
    at(ctx, 560, 1340, 0.86, 0, () => bedBack(ctx));
    at(ctx, 560, 1230, 0.95, 0, () => torso(ctx, t, [-80, 230], [80, 230]));
    const dart = t > right ? Math.sign(Math.sin(t * 5)) : 0;
    at(ctx, 560, 1060, 1.05, wob(t, 2.2, 0.03 * panic), () => kid(ctx, t, { eyes: 'wide', look: t > right ? [dart, 0] : [0.2, -0.6], brows: 'worry', mouth: t > right ? 'wobble' : t < 31.4 ? 'grin' : 'flat', sweat: panic, bags: 0.4 }));
    at(ctx, 560, 1440, 1, 0, () => { phone(ctx, t, 200, 330, { glow: 0.6 }); hand(ctx, -80, -30); hand(ctx, 80, -30); });
    at(ctx, 560, 1340, 0.86, 0, () => blanket(ctx, t, 230));
    // bedside clock 1:37 → 1:38
    at(ctx, 150, 1330, 0.5, 0, () => { nightstand(ctx, t, 0); at(ctx, 0, -150, 0.7, 0, () => alarmClock(ctx, t, t > 36 ? '1:38' : '1:37', { size: 130 })); });
  });
  // math stickers
  const st = (x, y, w, lab, col, rot) => at(ctx, x, y, life(t, T(3, w) - 0.05, right - 0.2, 0.35), rot + wob(t, 0.8, 0.04), () => { rr(ctx, -150, -75, 300, 150, 40); paint(ctx, col, 9); text(ctx, lab, 0, 4, 92, C.white, { lw: 16 }); });
  st(200, 820, '4', '4h', C.purple, -0.12);
  st(880, 820, '22', '22m', C.pink, 0.1);
  st(540, 760, '12', '12s', C.orange, -0.04);
  // doctor clipboard
  at(ctx, 860, 1060, life(t, med - 0.05, 42, 0.4), 0.12 + wob(t, 0.7, 0.04), () => {
    rr(ctx, -110, -140, 220, 280, 22); paint(ctx, '#c98e62', 9); rr(ctx, -85, -110, 170, 225, 12); paint(ctx, '#fff', 6);
    rr(ctx, -40, -160, 80, 44, 12); paint(ctx, '#aaa', 6);
    ctx.fillStyle = C.red; ctx.fillRect(-14, -80, 28, 76); ctx.fillRect(-38, -56, 76, 28);
    text(ctx, t > right ? '???' : 'OK', 0, 60, 60, t > right ? C.red : C.green, { lw: 0 });
  });
  // the dramatic silence
  alpha(ctx, zoom * 0.6, () => { vignette(ctx, 0.9); });
}

// ---------- scene 5: morning (42–52) ----------
function scene5(ctx, t) {
  const sunT = T(4, 'sun'), birdsT = T(4, 'birds'), shipT = T(4, 'everything'), yawnT = T(4, 'nothing'), awakeT = T(4, 'awake.');
  const flash = 1 - seg(t, 42.15, 42.5);
  camera(ctx, t, 1.02, 540, 1100, () => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffd2a1'); g.addColorStop(1, '#ff9fae'); ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
    alpha(ctx, 0.18, () => { for (let i = 0; i < 30; i++) star(ctx, (i % 5) * 240 + (Math.floor(i / 5) % 2) * 120, 200 + Math.floor(i / 5) * 230, 22, '#fff', 0); });
    // sun beams
    alpha(ctx, 0.25 * seg(t, sunT, sunT + 0.6), () => { ctx.save(); ctx.translate(250, 860); ctx.rotate(t * 0.1); ctx.fillStyle = '#fff6c8'; for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1800, -160); ctx.lineTo(1800, 160); ctx.closePath(); ctx.fill(); } ctx.restore(); });
    at(ctx, 250, 880, 1, 0, () => windowFrame(ctx, t, 360, 400, ['#ffcf6e', '#ff9a6e'], () => {
      at(ctx, 30, lerp(220, -40, E.outBack(seg(t, sunT - 0.1, sunT + 0.6), 1.3)), 0.8, 0, () => sun(ctx, t, 90, 'smug'));
    }));
    // birds on the sill
    [[150, C.cyan, 0], [260, C.yellow, 1.1], [365, C.pink, 2.3]].forEach(([x, col, ph], i) =>
      at(ctx, x, 1085, pop(t, birdsT - 0.05 + i * 0.1, 0.35) * 0.8, 0, () => bird(ctx, t, col, ph, t > birdsT + 0.3 ? 1 : 0)));
    [[120, 950], [300, 930], [420, 980]].forEach(([x, y], i) => at(ctx, x, y, life(t, T(4, 'mocking') + i * 0.18, 52, 0.25), (i - 1) * 0.2, () => text(ctx, 'HA', 0, wob(t, 2, 6, i), 48, C.white, { lw: 10 })));
    // kid: zombie
    const nod = t > awakeT ? Math.sin(seg(t, awakeT, awakeT + 0.8) * Math.PI) * 0.25 : 0;
    at(ctx, 720, 1400, 0.86, 0, () => bedBack(ctx));
    at(ctx, 720, 1290, 0.95, 0, () => torso(ctx, t, [-80, 230], [80, 230]));
    at(ctx, 720, 1120 + nod * 120, 1.05, -0.08 + nod, () => kid(ctx, t, { eyes: t > yawnT ? 'shut' : 'tired', mouth: t > yawnT && t < awakeT + 0.6 ? 'yawn' : 'flat', bags: 1, hairMess: 1, glow: 0.4 }));
    at(ctx, 720, 1500, 1, 0, () => { phone(ctx, t, 200, 330, { glow: 0.4 }); hand(ctx, -80, -30); hand(ctx, 80, -30); });
    at(ctx, 720, 1400, 0.86, 0, () => blanket(ctx, t, 230));
    if (t > awakeT) zzz(ctx, 840, 980, t, seg(t, awakeT, awakeT + 0.3));
    // ship dream
    at(ctx, 760, 760, life(t, shipT - 0.05, yawnT + 0.6, 0.45), 0, () => thought(ctx, t, 520, 330, () => {
      ctx.fillStyle = '#2e5aa8'; ctx.fillRect(-300, -200, 600, 400);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(i * 50, -200); ctx.lineTo(i * 50, 200); ctx.moveTo(-300, i * 40); ctx.lineTo(300, i * 40); ctx.stroke(); }
      at(ctx, 0, 70, 0.52, 0, () => ship(ctx, t));
      text(ctx, '1740', -150, -90, 46, C.yellow, { lw: 8 });
    }));
    // WRONG flash
    alpha(ctx, flash * 0.55, () => { ctx.fillStyle = C.red; ctx.fillRect(-200, -200, W + 400, H + 400); });
  });
  at(ctx, 540, 470, pop(t, 42.12, 0.3) * (1 - seg(t, 43.3, 43.5)), -0.08, () => { ctx.save(); ctx.globalAlpha = 0.9; ctx.beginPath(); const r = 230; ctx.moveTo(-r, -r * 0.6); ctx.lineTo(r, r * 0.6); ctx.moveTo(r, -r * 0.6); ctx.lineTo(-r, r * 0.6); ctx.lineWidth = 70; ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 46; ctx.strokeStyle = C.red; ctx.stroke(); ctx.restore(); });
}

// ---------- scene 6: CTA (52–60) ----------
function scene6(ctx, t) {
  const you = T(5, 'watching'), clk = T(5, '2:00'), go = T(5, 'go'), drop = T(5, 'drop'), suf = T(5, 'suffer');
  camera(ctx, t, 1, 540, 1100, () => {
    nightSky(ctx, t, '#4a2f9a', '#150f40', 1);
    at(ctx, 880, 300, 1, 0, () => moon(ctx, t, 60));
    // YES, YOU
    at(ctx, 540, 1050, life(t, you - 0.05, clk - 0.05, 0.35), wob(t, 1, 0.05), () => { burst(ctx, 0, 0, 280, C.yellow, 18); text(ctx, 'YES,', 0, -60, 110, C.white, { lw: 18 }); text(ctx, 'YOU.', 0, 70, 150, C.pink, { lw: 22 }); });
    // ringing alarm clock 2:00 AM
    at(ctx, 540, 1060, life(t, clk - 0.05, go + 0.12, 0.4) * 1.05, 0, () => alarmClock(ctx, t, '2:00', { ring: 1, size: 140 }));
    at(ctx, 540, 1290, Math.min(pop(t, T(5, 'AM'), 0.3), life(t, clk - 0.05, go + 0.12, 0.4)), 0, () => { rr(ctx, -90, -40, 180, 80, 40); paint(ctx, C.yellow, 7); text(ctx, 'AM', 0, 4, 60, C.ink, { lw: 0 }); });
    // GO TO SLEEP pillow
    at(ctx, 540, 1080, life(t, go - 0.05, drop - 0.05, 0.45), wob(t, 0.8, 0.03), () => {
      rr(ctx, -330, -170, 660, 340, 150); paint(ctx, '#ffffff', 12);
      ctx.beginPath(); ctx.moveTo(-200, -120); ctx.quadraticCurveTo(0, -60, 200, -120); ctx.lineWidth = 5; ctx.strokeStyle = '#d9d2ff'; ctx.stroke();
      at(ctx, 0, -10, 1, 0.1, () => moon(ctx, t, 80));
      ctx.beginPath(); ctx.moveTo(-60, -60); ctx.quadraticCurveTo(10, -180, 110, -140); ctx.quadraticCurveTo(40, -90, 60, -50); ctx.closePath(); paint(ctx, C.blue, 7); circle(ctx, 115, -142, 22, '#fff', 6);
      zzz(ctx, 150, -110, t, 1);
    });
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + t * 0.4, k = seg(t, go, go + 0.6); alpha(ctx, (1 - seg(t, drop - 0.3, drop)) * k, () => sparkle(ctx, 540 + Math.cos(a) * 420 * k, 1080 + Math.sin(a) * 320 * k, 24, C.yellow)); }
    // comment card
    const msg = 'same. it’s 2 am lol', typed = msg.slice(0, Math.floor(seg(t, drop + 0.25, drop + 1.3) * msg.length));
    at(ctx, 540, 1030, pop(t, drop - 0.05, 0.4), -0.03, () => commentCard(ctx, t, typed + (Math.floor(t * 3) % 2 && typed.length < msg.length ? '|' : '')));
    // fellow sufferers
    [[220, 1380, C.lilac, 0], [540, 1420, C.cyan, 0.15], [860, 1380, C.yellow, 0.3]].forEach(([x, y, col, d], i) => at(ctx, x, y, pop(t, suf - 0.05 + d, 0.35) * 0.78, wob(t, 0.6, 0.05, i), () => {
      circle(ctx, 0, 0, 170, col, 10); kid(ctx, t + i, { eyes: 'tired', bags: 1, mouth: i === 1 ? 'smile' : 'flat', glow: 0.8, hairMess: 0.5 * i });
    }));
    for (let i = 0; i < 6; i++) { const k = ((t - suf) * 0.6 + i / 6) % 1; if (t > suf) alpha(ctx, Math.sin(k * Math.PI), () => heart(ctx, 150 + i * 160, 1300 - k * 420, 0.7, i % 2 ? C.pink : C.red)); }
  });
}

// ---------- transitions ----------
function wipe(ctx, t) {
  for (const b of BOUNDS) {
    const k = seg(t, b - 0.24, b + 0.24); if (k <= 0 || k >= 1) continue;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.5);
    const cx = lerp(-3100, 3100, E.inOutCubic(k));
    [[C.yellow, -720], [C.pink, 0], [C.cyan, 720]].forEach(([col, off]) => { ctx.fillStyle = col; ctx.fillRect(cx + off - 380, -2200, 760, 4400); ctx.strokeStyle = C.ink; ctx.lineWidth = 14; ctx.strokeRect(cx + off - 380, -2200, 760, 4400); });
    ctx.restore();
  }
}

// ---------- frame ----------
function sceneFor(t) { return t < 8 ? scene1 : t < 18 ? scene2 : t < 30 ? scene3 : t < 42 ? scene4 : t < 52 ? scene5 : scene6; }
function drawFrame(t) {
  const ctx = CTX; ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = '#140f3a'; ctx.fillRect(0, 0, W, H);
  sceneFor(t)(ctx, t);
  vignette(ctx, 0.35);
  const [sx, sy] = shakeAt(t); ctx.save(); ctx.translate(sx * 0.6, sy * 0.6); captions(ctx, t, CAP_Y); ctx.restore();
  wipe(ctx, t);
}

// ---------- SFX cues (consumed by scripts/mix.py) ----------
function buildCues() {
  const q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  BOUNDS.forEach(b => add(b - 0.2, 'whoosh', 0.9));
  add(0.1, 'sparkle', 0.5);
  add(T(0, 'No'), 'boing', 0.8); add(T(0, '8'), 'pop', 0.9); add(T(0, 'restorative'), 'chime', 0.5); add(T(0, 'sleep,'), 'click', 0.6); add(T(0, 'fresh'), 'sparkle', 0.7);
  add(8.0, 'buzz', 0.9, { dur: 1.0 }); add(T(1, 'check.'), 'swoosh', 0.7); add(T(1, 'emergency,'), 'siren', 0.55, { dur: 2.2 }); add(T(1, 'critical.'), 'alert', 0.7);
  for (let i = 0; i < 3; i++) add(T(1, '10') + i, 'tick', 0.6); add(T(1, 'max.'), 'stamp', 0.9);
  add(18.0, 'ff', 0.6, { dur: T(2, 'and') - 18 }); add(T(2, '3'), 'pop', 0.8); add(T(2, 'and'), 'swoosh', 0.8); add(T(2, 'deeply'), 'pop', 0.7);
  add(T(2, 'hold'), 'aww', 0.6); add(T(2, 'drift'), 'boing', 0.5); add(27.3, 'swipe', 0.7); add(28.7, 'swipe', 0.7); add(27.8, 'pop', 0.5);
  add(T(3, 'fine!'), 'boing', 0.6); add(T(3, '4'), 'pop', 0.8); add(T(3, '22'), 'pop', 0.8); add(T(3, '12'), 'pop', 0.8);
  add(T(3, 'medically'), 'ding', 0.6); add(T(3, 'right?', 40) - 0.9, 'cricket', 0.5, { dur: 1.6 }); add(T(3, 'right?', 40) + 0.1, 'gulp', 0.7);
  add(42.12, 'buzzer', 0.9); add(T(4, 'sun'), 'rise', 0.6); add(T(4, 'birds'), 'birds', 0.7, { dur: 6 }); add(T(4, 'everything'), 'sparkle', 0.6);
  add(T(4, 'nothing'), 'yawn', 0.6); add(T(4, 'awake.') + 0.2, 'thud', 0.6);
  add(T(5, 'watching'), 'pop', 0.8); add(T(5, '2:00'), 'alarm', 0.4, { dur: T(5, 'go') - T(5, '2:00') }); add(T(5, 'go'), 'poof', 0.8); add(T(5, 'go') + 0.1, 'sparkle', 0.6);
  add(T(5, 'drop'), 'pop', 0.8); add(T(5, 'drop') + 0.25, 'typing', 0.5, { dur: 1.05 }); add(T(5, 'suffer'), 'pop', 0.7); add(T(5, 'suffer') + 0.15, 'pop', 0.6); add(T(5, 'suffer') + 0.3, 'pop', 0.6); add(59.5, 'chime', 0.5);
  // soft ticks on highlighted caption words that have nothing else nearby
  captionGroups().forEach(g => g.words.forEach(w => { if (keyColor(w.w, g.si) && !q.some(c => Math.abs(c.t - w.t0) < 0.25)) add(w.t0, 'tick_soft', 0.35); }));
  return q.sort((a, b) => a.t - b.t);
}
function initShakes() { SHAKES.push([T(0, 'No'), 10], [T(1, 'max.'), 16], [42.12, 34], [T(3, 'right?', 40), 6], [T(5, '2:00'), 10], [T(5, 'go'), 12]); }
