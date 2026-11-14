// Roman hidden-history art: marble, gold, toxic green. Flat motion-graphics with soft gradients.
const R = {
  gold: '#d4a84b', goldL: '#f3d27a', goldD: '#8a6424', green: '#8dff6e', greenD: '#2f9e3a', marble: '#ece8e1', marbleD: '#cfc8bd',
  black: '#0d0b0a', skin: '#e0ab86', skinD: '#c48b67', hair: '#3a2416', purple: '#5a1f4f', purpleL: '#7a2e6b', clay: '#b0603a', clayD: '#7e3f22', lead: '#7d8590', bronze: '#c08a3e',
};
const Fill = (ctx, c) => { ctx.fillStyle = c; ctx.fill(); };

// ---------- marble (pre-rendered once) ----------
function makeMarble(w, h, dark, seed) {
  const c = new OffscreenCanvas(w, h), x = c.getContext('2d'), r = rng(seed);
  const g = x.createLinearGradient(0, 0, w, h);
  if (dark) { g.addColorStop(0, '#1b1715'); g.addColorStop(1, '#0c0a09'); } else { g.addColorStop(0, '#f2eee8'); g.addColorStop(1, '#d9d2c7'); }
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // soft clouds
  for (let i = 0; i < 40; i++) { const cx = r() * w, cy = r() * h, rad = 80 + r() * 260; const gg = x.createRadialGradient(cx, cy, 0, cx, cy, rad); const a = dark ? 0.05 : 0.07; gg.addColorStop(0, dark ? `rgba(80,70,60,${a})` : `rgba(160,150,140,${a})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
  // veins
  for (let i = 0; i < 26; i++) {
    let px = r() * w, py = r() * h, ang = r() * Math.PI * 2; const len = 300 + r() * 900;
    x.beginPath(); x.moveTo(px, py);
    for (let s = 0; s < len; s += 30) { ang += (r() - 0.5) * 0.6; px += Math.cos(ang) * 30; py += Math.sin(ang) * 30; x.lineTo(px, py); }
    const gold = dark && i % 4 === 0;
    x.strokeStyle = gold ? 'rgba(212,168,75,0.55)' : dark ? 'rgba(170,160,150,0.18)' : 'rgba(110,100,95,0.22)';
    x.lineWidth = gold ? 2.5 : 0.8 + r() * 2.2; x.stroke();
  }
  return c;
}
let MARBLE_L = null, MARBLE_D = null;
function marbleBg(ctx, dark = true, a = 1) {
  if (!MARBLE_D) { MARBLE_D = makeMarble(1080, 1920, true, 7); MARBLE_L = makeMarble(1080, 1920, false, 11); }
  alpha(ctx, a, () => ctx.drawImage(dark ? MARBLE_D : MARBLE_L, 0, 0));
}
// ---------- gold greek-key band ----------
function meander(ctx, y, a = 1) {
  alpha(ctx, a, () => {
    ctx.save(); ctx.strokeStyle = R.gold; ctx.lineWidth = 5; ctx.lineJoin = 'miter';
    ctx.beginPath(); ctx.moveTo(30, y - 26); ctx.lineTo(1050, y - 26); ctx.moveTo(30, y + 26); ctx.lineTo(1050, y + 26); ctx.stroke();
    for (let x = 40; x < 1040; x += 52) { ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x, y - 16); ctx.lineTo(x + 36, y - 16); ctx.lineTo(x + 36, y + 8); ctx.lineTo(x + 14, y + 8); ctx.lineTo(x + 14, y - 4); ctx.lineTo(x + 24, y - 4); ctx.stroke(); }
    ctx.restore();
  });
}
function dust(ctx, t, n = 30, col = 'rgba(243,210,122,0.6)') {
  const r = rng(31);
  for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, sp = 10 + r() * 25, ph = r() * 6; const x = x0 + Math.sin(t * 0.4 + ph) * 40, y = ((y0 - t * sp) % H + H) % H; alpha(ctx, 0.3 + 0.7 * Math.abs(Math.sin(t + ph)), () => circle(ctx, x, y, 2 + (i % 3), col, 0)); }
}
function glow(ctx, x, y, r, col, a = 1) { alpha(ctx, a, () => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }); }
function label(ctx, s, x, y, size, col, o = {}) { text(ctx, s, x, y, size, col, { lw: 0, font: 'Cinzel', weight: o.weight || 700, align: o.align }); }

// ---------- the noblewoman (profile facing right; origin = base of neck) ----------
// o: powder 0..1, thick 0..1 (cracked mask), spots 0..1, tox 0..1 (green under skin), thin 0..1 (hair loss), eye 'open'|'closed'|'sad', blemish 0..1
function profilePath() {
  const p = new Path2D();
  p.moveTo(-80, 40); p.lineTo(-86, -140); p.bezierCurveTo(-170, -200, -160, -380, -50, -392); p.bezierCurveTo(20, -398, 58, -350, 62, -284);
  p.lineTo(64, -252); p.lineTo(102, -190); p.quadraticCurveTo(104, -176, 88, -173); p.lineTo(80, -168); p.quadraticCurveTo(90, -158, 84, -148);
  p.quadraticCurveTo(80, -142, 76, -140); p.quadraticCurveTo(86, -132, 80, -124); p.quadraticCurveTo(68, -116, 66, -108); p.quadraticCurveTo(74, -88, 56, -76);
  p.quadraticCurveTo(40, -70, 32, -60); p.lineTo(30, 40); p.closePath(); return p;
}
const PROFILE = typeof Path2D !== 'undefined' ? profilePath() : null;
const SPOTS = (() => { const r = rng(5); return Array.from({ length: 22 }, () => ({ x: -40 + r() * 100, y: -330 + r() * 260, r: 5 + r() * 12 })); })();
const CURLS = (() => { const c = []; for (let i = 0; i < 13; i++) { const a = Math.PI * 1.05 + (i / 12) * Math.PI * 0.62; c.push({ x: Math.cos(a) * 125 - 30, y: Math.sin(a) * 125 - 300, r: 27 + (i % 3) * 3, i }); } return c; })();
function noblewoman(ctx, t, o = {}) {
  const thin = o.thin || 0;
  // stola (draped shoulders)
  ctx.beginPath(); ctx.moveTo(-250, 230); ctx.quadraticCurveTo(-220, 20, -80, 10); ctx.quadraticCurveTo(0, 60, 60, 20); ctx.quadraticCurveTo(200, 30, 230, 230); ctx.closePath();
  Fill(ctx, R.purple); ctx.lineWidth = 8; ctx.strokeStyle = R.gold; ctx.beginPath(); ctx.moveTo(-200, 120); ctx.quadraticCurveTo(-60, 60, 80, 30); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; for (const k of [0, 1, 2]) { ctx.beginPath(); ctx.moveTo(-160 + k * 60, 220); ctx.quadraticCurveTo(-120 + k * 60, 120, -40 + k * 50, 50); ctx.stroke(); }
  // back bun
  const bunR = 70 * (1 - thin * 0.45);
  circle(ctx, -150, -250, bunR, R.hair, 0); ctx.beginPath(); ctx.arc(-150, -250, bunR * 0.6, 0, Math.PI * 1.6); ctx.lineWidth = 6; ctx.strokeStyle = '#2a1a10'; ctx.stroke();
  // skin
  ctx.save(); ctx.fillStyle = R.skin; ctx.fill(PROFILE); ctx.clip(PROFILE);
  ctx.fillStyle = 'rgba(160,100,70,0.18)'; ctx.fillRect(-200, -200, 120, 300);
  if (o.tox) { const g = ctx.createRadialGradient(20, -200, 10, 20, -200, 260); g.addColorStop(0, `rgba(141,255,110,${0.55 * o.tox})`); g.addColorStop(1, `rgba(47,158,58,${0.15 * o.tox})`); ctx.fillStyle = g; ctx.fillRect(-200, -420, 400, 500); }
  if (o.blemish) for (const s of SPOTS.slice(0, 8)) alpha(ctx, o.blemish * 0.6, () => circle(ctx, s.x, s.y, s.r * 0.5, '#b4644a', 0));
  if (o.powder) alpha(ctx, o.powder, () => { ctx.fillStyle = '#f7f5f0'; ctx.fillRect(-200, -420, 400, 500); });
  if (o.spots) SPOTS.forEach((s, i) => alpha(ctx, clamp(o.spots * 22 - i) * 0.85, () => circle(ctx, s.x, s.y, s.r, '#4a3328', 0)));
  if (o.thick) { alpha(ctx, o.thick, () => { ctx.fillStyle = '#fbfaf6'; ctx.fillRect(-200, -420, 400, 500); ctx.strokeStyle = 'rgba(120,115,105,0.5)'; ctx.lineWidth = 2; const r = rng(3); for (let i = 0; i < 14; i++) { let x = -40 + r() * 110, y = -330 + r() * 250; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 40; y += r() * 26; ctx.lineTo(x, y); } ctx.stroke(); } });
    if (o.tox) glow(ctx, 30, -200, 200, `rgba(141,255,110,${0.35 * o.tox * o.thick})`); }
  ctx.restore();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(60,30,20,0.5)'; ctx.stroke(PROFILE);
  // ear + earring
  ctx.beginPath(); ctx.ellipse(-40, -214, 18, 30, 0.15, 0, Math.PI * 2); Fill(ctx, (o.powder || o.thick) > 0.5 ? '#ece6dc' : R.skinD);
  circle(ctx, -42, -172, 9, R.goldL, 0); circle(ctx, -42, -150, 7, '#2e8f6a', 0);
  // eye
  const ey = o.eye || 'open';
  if (ey === 'closed') { ctx.beginPath(); ctx.arc(40, -250, 16, 0.1 * Math.PI, 0.7 * Math.PI); ctx.lineWidth = 4; ctx.strokeStyle = '#2a1a10'; ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(24, -252); ctx.quadraticCurveTo(42, -264, 58, -250); ctx.quadraticCurveTo(42, -242, 24, -252); Fill(ctx, '#fff'); circle(ctx, 48, -251, 6, '#2a1a10', 0);
    ctx.beginPath(); ctx.moveTo(22, -253); ctx.quadraticCurveTo(42, -268, 60, -250); ctx.lineWidth = 4; ctx.strokeStyle = '#2a1a10'; ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(20, ey === 'sad' ? -270 : -276); ctx.quadraticCurveTo(44, -290, 62, ey === 'sad' ? -270 : -280); ctx.lineWidth = 5; ctx.strokeStyle = R.hair; ctx.stroke();
  // lips
  ctx.beginPath(); ctx.moveTo(78, -147); ctx.quadraticCurveTo(86, -140, 76, -139); ctx.quadraticCurveTo(84, -132, 79, -125); ctx.lineWidth = 6; ctx.strokeStyle = '#b8323f'; ctx.stroke();
  // hair cap over the crown (thins out with hair loss)
  ctx.save(); ctx.clip(PROFILE);
  // receding, thinning hairline: the cap shrinks back and gets sparse
  alpha(ctx, 1 - thin * 0.35, () => { ctx.beginPath(); ctx.ellipse(-55 - thin * 45, -310 - thin * 20, 150 - thin * 40, 108 - thin * 28, -0.25, 0, Math.PI * 2); Fill(ctx, R.hair); });
  if (thin) alpha(ctx, thin * 0.7, () => { ctx.strokeStyle = R.hair; ctx.lineWidth = 3; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-60 + i * 12, -395 + i * 4); ctx.quadraticCurveTo(-20 + i * 10, -380 + i * 6, 0 + i * 8, -350 + i * 7); ctx.stroke(); } });
  ctx.restore();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(60,30,20,0.5)'; ctx.stroke(PROFILE);
  // front curls + diadem
  CURLS.forEach(c => { const lost = thin * 13 > c.i * 1.0 + (c.i % 2) * 3; if (lost) return; circle(ctx, c.x, c.y, c.r, R.hair, 0); ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 0.55, 0.5, 4.5); ctx.lineWidth = 4; ctx.strokeStyle = '#2a1a10'; ctx.stroke(); });
  ctx.beginPath(); ctx.arc(-30, -300, 132, Math.PI * 1.12, Math.PI * 1.62); ctx.lineWidth = 12; ctx.strokeStyle = R.gold; ctx.stroke(); circle(ctx, -40, -430, 12, '#2e8f6a', 0);
}
// falling hair curls
function fallingCurls(ctx, t, t0, n = 6) { for (let i = 0; i < n; i++) { const k = (t - t0 - i * 0.35); if (k < 0) continue; const y = -200 + k * k * 300, x = -60 + i * 20 + Math.sin(k * 3 + i) * 20; alpha(ctx, 1 - clamp((k - 1.2) / 0.4), () => { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(k * 4 + i) * 0.8); ctx.beginPath(); ctx.moveTo(-18, -14); ctx.bezierCurveTo(10, -18, -10, 4, 14, 0); ctx.bezierCurveTo(30, -4, 0, 18, 20, 16); ctx.lineWidth = 4; ctx.strokeStyle = R.hair; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); }); } }

// ---------- bronze mirror ----------
function mirror(ctx, t, reflect, o = {}) {
  ctx.beginPath(); ctx.moveTo(-24, 170); ctx.lineTo(-30, 420); ctx.quadraticCurveTo(0, 440, 30, 420); ctx.lineTo(24, 170); Fill(ctx, R.goldD);
  for (const y of [240, 320, 390]) { ctx.beginPath(); ctx.ellipse(0, y, 36, 12, 0, 0, Math.PI * 2); Fill(ctx, R.gold); }
  circle(ctx, 0, 0, 200, R.gold, 0); circle(ctx, 0, 0, 186, R.goldD, 0);
  const g = ctx.createRadialGradient(-60, -70, 20, 0, 0, 200); g.addColorStop(0, '#f6d9a0'); g.addColorStop(0.5, R.bronze); g.addColorStop(1, '#6e4517');
  circle(ctx, 0, 0, 176, g, 0);
  if (reflect) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 172, 0, Math.PI * 2); ctx.clip(); alpha(ctx, 0.55, () => reflect(ctx)); ctx.restore(); }
  alpha(ctx, 0.35, () => { ctx.beginPath(); ctx.ellipse(-70, -80, 40, 90, -0.6, 0, Math.PI * 2); Fill(ctx, '#fff6dc'); });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; circle(ctx, Math.cos(a) * 193, Math.sin(a) * 193, 5, R.goldL, 0); }
}
// ---------- servant's hand with brush ----------
function brushHand(ctx, t) {
  ctx.save(); ctx.rotate(-0.6);
  box_(ctx, -8, -10, 16, 230, 6, R.gold); ctx.beginPath(); ctx.moveTo(-18, -10); ctx.quadraticCurveTo(0, -80, 18, -10); ctx.closePath(); Fill(ctx, '#f7f5f0');
  ctx.beginPath(); ctx.ellipse(0, 230, 46, 34, 0, 0, Math.PI * 2); Fill(ctx, '#b07a58'); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-30 + i * 20, 205, 9, 22, 0, 0, Math.PI * 2); Fill(ctx, '#b07a58'); }
  ctx.restore();
}
function box_(ctx, x, y, w, h, r, fill) { rr(ctx, x, y, w, h, r); Fill(ctx, fill); }
function puff(ctx, t, x, y, a = 1) { const r = rng(Math.floor(t * 12)); for (let i = 0; i < 10; i++) alpha(ctx, a * (0.3 + r() * 0.5), () => circle(ctx, x + (r() - 0.5) * 120, y + (r() - 0.5) * 80, 4 + r() * 10, '#ffffff', 0)); }

// ---------- jar (pyxis) ----------
function pyxis(ctx, t, o = {}) {
  glow(ctx, 0, -60, 260, 'rgba(141,255,110,0.25)', o.glow || 0);
  ctx.beginPath(); ctx.ellipse(0, 40, 150, 34, 0, 0, Math.PI * 2); Fill(ctx, R.goldD);
  box_(ctx, -150, -120, 300, 160, 20, R.marble); alpha(ctx, 0.5, () => { ctx.strokeStyle = R.marbleD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-120, -100); ctx.quadraticCurveTo(-40, -40, 30, -90); ctx.quadraticCurveTo(80, -110, 140, 20); ctx.stroke(); });
  box_(ctx, -156, -20, 312, 20, 6, R.gold); box_(ctx, -156, -126, 312, 18, 6, R.gold);
  ctx.beginPath(); ctx.ellipse(0, -126, 156, 30, 0, Math.PI, 0); Fill(ctx, R.goldL); ctx.beginPath(); ctx.ellipse(0, -150, 34, 22, 0, 0, Math.PI * 2); Fill(ctx, R.gold);
  if (o.open) { ctx.beginPath(); ctx.ellipse(0, -126, 140, 24, 0, 0, Math.PI * 2); Fill(ctx, '#f7f5f0'); }
  label(ctx, o.text || '', 0, -60, 34, R.goldD);
}
// ---------- skull ----------
function skull(ctx, col = R.green, a = 1) {
  alpha(ctx, a, () => {
    glow(ctx, 0, -20, 280, 'rgba(141,255,110,0.35)');
    ctx.beginPath(); ctx.arc(0, -40, 140, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(80, 90); ctx.lineTo(-80, 90); ctx.closePath(); Fill(ctx, col);
    box_(ctx, -76, 80, 152, 70, 18, col);
    ctx.globalCompositeOperation = 'destination-out';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 55, 0, 42, 48, s * 0.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(-18, 85); ctx.lineTo(18, 85); ctx.closePath(); ctx.fill();
    for (let i = -2; i <= 2; i++) ctx.fillRect(i * 28 - 4, 110, 8, 40);
    ctx.globalCompositeOperation = 'source-over';
  });
}
// ---------- workshop ----------
function claypot(ctx, t, crust = 0, vapor = 0) {
  // rod + lead strips hanging into the pot
  box_(ctx, -250, -330, 500, 22, 10, '#5a3a22');
  for (let i = 0; i < 4; i++) { const x = -150 + i * 100; box_(ctx, x - 26, -320, 52, 300, 6, R.lead);
    alpha(ctx, clamp(crust * 1.3 - i * 0.1), () => { const h = 300 * clamp(crust * 1.1 - i * 0.05); box_(ctx, x - 28, -20 - h, 56, h, 6, '#f2f0ea'); for (let k = 0; k < 6; k++) circle(ctx, x - 24 + (k * 17) % 48, -30 - (k * 47) % Math.max(10, h - 20), 6, '#ffffff', 0); }); }
  // pot
  ctx.beginPath(); ctx.moveTo(-230, -60); ctx.quadraticCurveTo(-330, 140, -180, 330); ctx.lineTo(180, 330); ctx.quadraticCurveTo(330, 140, 230, -60); ctx.closePath();
  const g = ctx.createLinearGradient(-300, 0, 300, 0); g.addColorStop(0, R.clayD); g.addColorStop(0.45, R.clay); g.addColorStop(1, R.clayD); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -60, 240, 44, 0, 0, Math.PI * 2); Fill(ctx, '#8a4a2a'); ctx.beginPath(); ctx.ellipse(0, -56, 214, 34, 0, 0, Math.PI * 2); Fill(ctx, '#3a4a2a');
  alpha(ctx, 0.6, () => { ctx.beginPath(); ctx.ellipse(0, -56, 214, 34, 0, 0, Math.PI * 2); Fill(ctx, 'rgba(141,255,110,0.25)'); });
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 6; for (const y of [60, 160]) { ctx.beginPath(); ctx.moveTo(-270, y); ctx.quadraticCurveTo(0, y + 30, 270, y); ctx.stroke(); }
  // vapor wisps
  if (vapor) for (let i = 0; i < 6; i++) { const k = ((t * 0.4 + i / 6) % 1); alpha(ctx, vapor * Math.sin(k * Math.PI) * 0.6, () => { ctx.beginPath(); const x = -150 + i * 60; ctx.moveTo(x, -70); ctx.bezierCurveTo(x + 40, -70 - k * 120, x - 40, -110 - k * 200, x + Math.sin(t + i) * 30, -120 - k * 300); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(141,255,110,0.6)'; ctx.lineCap = 'round'; ctx.stroke(); }); }
}
function elementTile(ctx) {
  box_(ctx, -150, -170, 300, 340, 26, 'rgba(13,11,10,0.85)'); rr(ctx, -150, -170, 300, 340, 26); ctx.lineWidth = 8; ctx.strokeStyle = R.gold; ctx.stroke();
  label(ctx, '82', -100, -120, 44, R.goldL, { align: 'left' }); text(ctx, 'Pb', 0, 10, 170, R.green, { lw: 0, font: 'Fredoka', weight: 700 }); label(ctx, 'LEAD', 0, 120, 44, R.goldL);
}
function plaque(ctx, s, size = 72) { ctx.font = `800 ${size}px Cinzel`; const w = ctx.measureText(s).width + 90; box_(ctx, -w / 2, -size * 0.85, w, size * 1.7, 14, R.gold); box_(ctx, -w / 2 + 10, -size * 0.85 + 10, w - 20, size * 1.7 - 20, 8, '#1a1512'); text(ctx, s, 0, 4, size, R.goldL, { lw: 0, font: 'Cinzel', weight: 800 }); }
function skinSection(ctx, t, k) { // cross-section, poison seeping down (k 0..1)
  box_(ctx, -360, -260, 720, 520, 24, '#1a1512'); rr(ctx, -360, -260, 720, 520, 24); ctx.lineWidth = 6; ctx.strokeStyle = R.gold; ctx.stroke();
  ctx.save(); rr(ctx, -354, -254, 708, 508, 20); ctx.clip();
  box_(ctx, -360, -200, 720, 40, 0, '#f7f5f0'); box_(ctx, -360, -160, 720, 110, 0, '#e8b796'); box_(ctx, -360, -50, 720, 300, 0, '#d98a7c');
  ctx.beginPath(); ctx.moveTo(-360, 120); ctx.bezierCurveTo(-120, 80, 120, 170, 360, 110); ctx.lineWidth = 44; ctx.strokeStyle = '#a52a3a'; ctx.stroke();
  const r = rng(4); for (let i = 0; i < 26; i++) { const x = -330 + r() * 660, d = r(), y = -190 + clamp(k * 1.3 - d * 0.3) * 330; alpha(ctx, clamp(k * 3 - d), () => { glow(ctx, x, y, 22, 'rgba(141,255,110,0.6)'); circle(ctx, x, y, 7, R.green, 0); }); }
  ctx.restore();
  label(ctx, 'SKIN', -300, -228, 26, R.goldL, { align: 'left' }); label(ctx, 'BLOOD', 230, 214, 26, R.goldL);
}
function tooth(ctx, rot) {
  ctx.beginPath(); ctx.moveTo(-70, -60); ctx.quadraticCurveTo(-80, -120, -30, -110); ctx.quadraticCurveTo(0, -95, 30, -110); ctx.quadraticCurveTo(80, -120, 70, -60);
  ctx.quadraticCurveTo(60, 20, 46, 110); ctx.quadraticCurveTo(30, 120, 20, 40); ctx.quadraticCurveTo(0, 20, -20, 40); ctx.quadraticCurveTo(-30, 120, -46, 110); ctx.quadraticCurveTo(-60, 20, -70, -60);
  const c = `rgb(${lerp(245, 110, rot) | 0},${lerp(242, 95, rot) | 0},${lerp(232, 60, rot) | 0})`; Fill(ctx, c);
  if (rot > 0.4) { ctx.beginPath(); ctx.moveTo(-10, -100); ctx.lineTo(8, -50); ctx.lineTo(-6, -10); ctx.lineTo(12, 40); ctx.lineWidth = 6; ctx.strokeStyle = '#2a1a10'; ctx.stroke(); }
}
function asclepius(ctx, t) {
  box_(ctx, -10, -260, 20, 520, 8, R.goldD); circle(ctx, 0, -266, 18, R.gold, 0);
  ctx.beginPath(); for (let y = 230; y > -230; y -= 6) { const x = Math.sin(y * 0.03) * 46; y === 230 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.lineWidth = 22; ctx.strokeStyle = R.greenD; ctx.lineCap = 'round'; ctx.stroke(); ctx.beginPath(); ctx.ellipse(Math.sin(-230 * 0.03) * 46 + 10, -236, 26, 16, -0.3, 0, Math.PI * 2); Fill(ctx, R.greenD);
}
function scroll(ctx, lines) {
  box_(ctx, -230, -150, 460, 300, 10, '#e9dcbf'); for (const y of [-160, 150]) { box_(ctx, -250, y - 16, 500, 32, 16, '#c9b48a'); }
  lines.forEach((l, i) => label(ctx, l[0], 0, -60 + i * 90, l[1] || 54, l[2] || '#3a2416'));
}
function scale_(ctx, t, tilt, left, right) {
  box_(ctx, -10, -240, 20, 480, 6, R.gold); box_(ctx, -110, 230, 220, 24, 10, R.goldD); circle(ctx, 0, -250, 22, R.goldL, 0);
  ctx.save(); ctx.translate(0, -230); ctx.rotate(tilt);
  box_(ctx, -330, -8, 660, 16, 8, R.gold);
  for (const [s, fn] of [[-1, left], [1, right]]) { ctx.save(); ctx.translate(s * 310, 0); ctx.rotate(-tilt);
    ctx.strokeStyle = R.goldL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, 200); ctx.moveTo(0, 0); ctx.lineTo(90, 200); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 200, 110, 26, 0, 0, Math.PI); Fill(ctx, R.gold); at(ctx, 0, 190, 0.5, 0, fn); ctx.restore(); }
  ctx.restore();
}
function heartIcon(ctx, col = '#c9364a') { ctx.beginPath(); ctx.moveTo(0, 60); ctx.bezierCurveTo(-120, -20, -60, -110, 0, -44); ctx.bezierCurveTo(60, -110, 120, -20, 0, 60); Fill(ctx, col); }
function coinStack(ctx) { for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, -i * 22, 70, 20, 0, 0, Math.PI * 2); Fill(ctx, i % 2 ? R.gold : R.goldL); } }
function laurel(ctx) { for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + s * (0.3 + i * 0.32); ctx.save(); ctx.translate(Math.cos(a) * 110, Math.sin(a) * 110); ctx.rotate(a + s * 0.9); ctx.beginPath(); ctx.ellipse(0, 0, 30, 12, 0, 0, Math.PI * 2); Fill(ctx, R.gold); ctx.restore(); } }
