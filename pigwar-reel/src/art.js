// The Pig War (1859) – colourful outlined cartoon art. Characters stand with feet at (0,0).
const K = {
  ink: '#1d1846', pig: '#ffa8c8', pigD: '#f07aa8', skin: '#ffcfa6', skinD: '#e8a87c', usBlue: '#2f5fb3', usBlueD: '#24488a', ukRed: '#d63a3a', ukRedD: '#a82828',
  white: '#fff8ee', gold: '#ffd23f', brown: '#8a5a34', brownD: '#5e3a20', grass: '#6cc95a', grassD: '#4aa14a', sea: '#3fa9e0', seaD: '#2a7fbf', sand: '#f2d38a', sky: '#9fdcff',
};
const OL = 7;
function shape(ctx, fill, lw = OL) { paint(ctx, fill, lw, K.ink); }
function rbox(ctx, x, y, w, h, r, fill, lw = OL) { rr(ctx, x, y, w, h, r); shape(ctx, fill, lw); }

// ---------- the pig (star of the show) ----------
// o: dig 0..1 (head down, digging), halo 0..1, eyes 'open'|'happy'|'x'|'worried', tag (company tag on ear)
function pig(ctx, t, o = {}) {
  const dig = o.dig || 0, bob = o.walk ? Math.abs(Math.sin(t * 9)) * 8 : 0;
  ctx.save(); ctx.translate(0, -bob);
  alpha(ctx, 0.25, () => ellipse(ctx, 0, bob + 4, 130, 18, '#000', 0));
  // legs
  for (const x of [-70, -30, 30, 70]) rbox(ctx, x - 14, -60, 28, 60, 10, K.pigD);
  // curly tail
  ctx.beginPath(); ctx.moveTo(-118, -110); ctx.bezierCurveTo(-170, -130, -150, -180, -130, -160); ctx.bezierCurveTo(-110, -140, -150, -120, -160, -150); ctx.lineWidth = 10; ctx.strokeStyle = K.ink; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = K.pigD; ctx.stroke();
  // body
  ellipse(ctx, 0, -120, 130, 80, K.pig);
  alpha(ctx, 0.35, () => ellipse(ctx, -20, -150, 70, 30, '#fff', 0));
  // head
  ctx.save(); ctx.translate(110, -140 + dig * 50); ctx.rotate(dig * 0.5 + Math.sin(t * 2) * 0.03);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 30 - 10, -50); ctx.lineTo(s * 52 - 6, -100 + (o.earUp ? -10 : 0)); ctx.lineTo(s * 60 + 10, -40); ctx.closePath(); shape(ctx, K.pigD); }
  circle(ctx, 0, 0, 70, K.pig);
  ellipse(ctx, 48, 16, 34, 28, K.pigD); ellipse(ctx, 40, 14, 6, 10, K.ink, 0); ellipse(ctx, 58, 14, 6, 10, K.ink, 0);
  const e = o.eyes || 'open';
  for (const x of [-18, 18]) {
    if (e === 'x') { ctx.beginPath(); ctx.moveTo(x - 10, -30); ctx.lineTo(x + 10, -10); ctx.moveTo(x + 10, -30); ctx.lineTo(x - 10, -10); ctx.lineWidth = 6; ctx.strokeStyle = K.ink; ctx.stroke(); }
    else if (e === 'happy') { ctx.beginPath(); ctx.arc(x, -16, 10, 1.1 * Math.PI, 1.9 * Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = K.ink; ctx.stroke(); }
    else { circle(ctx, x, -20, 12, '#fff', 5); circle(ctx, x + (o.look || 0) * 4, -18, 6, K.ink, 0); if (e === 'worried') { ctx.beginPath(); ctx.moveTo(x - 14, -40 + (x < 0 ? 6 : 0)); ctx.lineTo(x + 14, -40 + (x < 0 ? 0 : 6)); ctx.lineWidth = 5; ctx.strokeStyle = K.ink; ctx.stroke(); } }
  }
  alpha(ctx, 0.5, () => { circle(ctx, -40, 14, 12, '#ff6fa0', 0); });
  if (o.tag) { rbox(ctx, -82, -48, 50, 30, 6, K.gold, 4); text(ctx, 'HBC', -57, -33, 18, K.ink, { lw: 0 }); }
  ctx.restore();
  if (o.halo) alpha(ctx, o.halo, () => { ctx.beginPath(); ctx.ellipse(110, -250 - Math.sin(t * 2) * 8, 60, 16, 0, 0, Math.PI * 2); ctx.lineWidth = 12; ctx.strokeStyle = K.gold; ctx.stroke(); });
  ctx.restore();
}
// dirt + potatoes flying while digging
function dirt(ctx, t, x, y, a = 1) {
  const r = rng(Math.floor(t * 8));
  for (let i = 0; i < 8; i++) { const k = ((t * 1.6 + i / 8) % 1); alpha(ctx, a * (1 - k), () => { const px = x + (i % 2 ? 1 : -1) * k * (60 + i * 12), py = y - Math.sin(k * Math.PI) * (120 + i * 10); if (i % 3 === 0) ellipse(ctx, px, py, 18, 13, '#c9934e', 4); else circle(ctx, px, py, 8 + (i % 2) * 5, K.brown, 0); }); }
}

// ---------- people ----------
// generic cartoon person; o.kind: 'farmer'|'redcoat'|'usSoldier'|'settlerUS'|'settlerUK'|'kaiser'; face; arm; walkT
function person(ctx, t, o = {}) {
  const kind = o.kind || 'farmer', ph = o.walkT ?? 0, walk = o.walk ? Math.sin(ph * Math.PI) : 0;
  const body = { farmer: '#6d8fc9', redcoat: K.ukRed, usSoldier: K.usBlue, settlerUS: '#8aa36a', settlerUK: '#b07a5a', kaiser: '#2e3a4a' }[kind];
  const legs = { farmer: '#4a6aa6', redcoat: '#1d2433', usSoldier: '#5a7ab0', settlerUS: '#5a4a3a', settlerUK: '#3a3a4a', kaiser: '#1d2433' }[kind];
  ctx.save(); ctx.translate(0, -Math.abs(walk) * 6);
  alpha(ctx, 0.25, () => ellipse(ctx, 0, 4, 70, 12, '#000', 0));
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 22, -150); ctx.rotate(s * walk * 0.3); rbox(ctx, -16, 0, 32, 150, 12, legs); rbox(ctx, -22, 138, 46, 22, 10, '#2a1e16', 5); ctx.restore(); }
  // torso
  rr(ctx, -60, -300, 120, 165, 36); shape(ctx, body);
  if (kind === 'farmer') { rbox(ctx, -42, -270, 84, 130, 16, '#4a6aa6', 5); circle(ctx, -28, -262, 7, K.gold, 0); circle(ctx, 28, -262, 7, K.gold, 0); }
  if (kind === 'redcoat') { ctx.beginPath(); ctx.moveTo(-50, -290); ctx.lineTo(50, -150); ctx.moveTo(50, -290); ctx.lineTo(-50, -150); ctx.lineWidth = 14; ctx.strokeStyle = '#fff'; ctx.stroke(); for (const y of [-260, -220, -180]) circle(ctx, 0, y, 6, K.gold, 0); }
  if (kind === 'usSoldier') { for (const y of [-270, -235, -200, -165]) circle(ctx, 0, y, 6, K.gold, 0); rbox(ctx, -60, -170, 120, 14, 4, '#1d2433', 0); }
  if (kind === 'kaiser') { for (const y of [-270, -230, -190]) circle(ctx, -18, y, 6, K.gold, 0), circle(ctx, 18, y, 6, K.gold, 0); rbox(ctx, -62, -300, 26, 16, 6, K.gold, 0); rbox(ctx, 36, -300, 26, 16, 6, K.gold, 0); ctx.beginPath(); ctx.moveTo(-50, -290); ctx.lineTo(40, -170); ctx.lineWidth = 12; ctx.strokeStyle = '#e8c84a'; ctx.stroke(); }
  // arms
  const arm = (s, ang, len = 130, item) => { ctx.save(); ctx.translate(s * 56, -286); ctx.rotate(ang); rbox(ctx, -15, 0, 30, len, 14, body); circle(ctx, 0, len + 6, 17, K.skin, 5); if (item) item(len); ctx.restore(); };
  const a = o.arm || 'down';
  if (a === 'rifle') { arm(-1, 0.5); arm(1, -0.6, 120, (len) => { ctx.save(); ctx.translate(0, len); ctx.rotate(-1.3); rbox(ctx, -10, -150, 20, 200, 6, K.brown, 5); rbox(ctx, -6, -230, 12, 90, 4, '#7a7f8a', 5); ctx.restore(); }); }
  else if (a === 'angry') { arm(-1, -2.4 + Math.sin(t * 12) * 0.2); arm(1, 2.4 - Math.sin(t * 12 + 1) * 0.2); }
  else if (a === 'paper') { arm(-1, 0.2); arm(1, -1.5, 120, (len) => { ctx.save(); ctx.translate(0, len + 10); rbox(ctx, -10, -50, 110, 140, 6, K.white, 5); text(ctx, 'ARREST', 45, -10, 24, K.ukRed, { lw: 0 }); for (let i = 0; i < 4; i++) rbox(ctx, 4, 20 + i * 18, 80, 6, 3, '#c9c2b6', 0); ctx.restore(); }); }
  else if (a === 'march') { arm(-1, 0.3 + walk * 0.3); arm(1, -0.4, 120, (len) => { ctx.save(); ctx.translate(0, len); ctx.rotate(-0.25); rbox(ctx, -8, -210, 16, 220, 5, K.brown, 4); ctx.restore(); }); }
  else if (a === 'facepalm') { arm(-1, 0.1); arm(1, 2.75, 130); }
  else if (a === 'no') { arm(-1, 0.1); arm(1, -2.2 + Math.sin(t * 14) * 0.35); }
  else if (a === 'point') { arm(-1, 0.1); arm(1, -1.6, 140); }
  else if (a === 'shrug') { arm(-1, 0.9, 110); arm(1, -0.9, 110); }
  else { arm(-1, 0.12 - walk * 0.3); arm(1, -0.12 + walk * 0.3); }
  // head
  const hy = -360;
  circle(ctx, 0, hy, 62, K.skin);
  const f = o.face || 'neutral';
  for (const x of [-22, 22]) {
    if (f === 'happy') { ctx.beginPath(); ctx.arc(x, hy - 2, 10, 1.1 * Math.PI, 1.9 * Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = K.ink; ctx.stroke(); }
    else if (f === 'shock') { circle(ctx, x, hy - 6, 13, '#fff', 4); circle(ctx, x, hy - 6, 5, K.ink, 0); }
    else circle(ctx, x + (o.look || 0) * 4, hy - 4, 7, K.ink, 0);
    if (f === 'angry' || f === 'grumpy' || f === 'sweat') { ctx.beginPath(); ctx.moveTo(x - 16, hy - 30 + (x < 0 ? -6 : 6) * (f === 'sweat' ? -1 : 1)); ctx.lineTo(x + 16, hy - 30 + (x < 0 ? 6 : -6) * (f === 'sweat' ? -1 : 1)); ctx.lineWidth = 6; ctx.strokeStyle = K.ink; ctx.stroke(); }
  }
  ctx.beginPath(); ctx.lineWidth = 6; ctx.strokeStyle = K.ink; ctx.lineCap = 'round';
  if (f === 'happy' || f === 'smile') { ctx.arc(0, hy + 16, 20, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else if (f === 'angry' || f === 'grumpy') { ctx.arc(0, hy + 40, 18, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
  else if (f === 'shock') { ctx.ellipse(0, hy + 30, 12, 16, 0, 0, Math.PI * 2); ctx.fillStyle = '#7a2338'; ctx.fill(); ctx.stroke(); }
  else if (f === 'sweat') { ctx.moveTo(-18, hy + 30); for (let i = 1; i <= 6; i++) ctx.lineTo(-18 + i * 6, hy + 30 + (i % 2 ? -6 : 6)); ctx.stroke(); }
  else { ctx.moveTo(-14, hy + 28); ctx.lineTo(14, hy + 28); ctx.stroke(); }
  if (f === 'sweat') { ctx.beginPath(); const y = hy - 30 + ((t * 40) % 30); ctx.moveTo(60, y - 20); ctx.quadraticCurveTo(74, y, 60, y + 8); ctx.quadraticCurveTo(46, y, 60, y - 20); shape(ctx, '#9fe8ff', 4); }
  if (f === 'angry' && o.steam) for (const s of [-1, 1]) { const k = (t * 1.5) % 1; alpha(ctx, 1 - k, () => circle(ctx, s * 70, hy - 70 - k * 60, 16 + k * 14, '#ffffff', 4)); }
  // hats / hair per kind
  if (kind === 'farmer') { ctx.beginPath(); ctx.ellipse(0, hy - 46, 100, 22, 0, 0, Math.PI * 2); shape(ctx, '#e8c46a'); rbox(ctx, -52, hy - 100, 104, 60, 20, '#e8c46a'); rbox(ctx, -52, hy - 62, 104, 14, 0, '#c9502e', 0);
    ctx.beginPath(); ctx.moveTo(-50, hy + 10); ctx.quadraticCurveTo(0, hy + 110, 50, hy + 10); ctx.quadraticCurveTo(0, hy + 60, -50, hy + 10); shape(ctx, '#8a5a34', 5); }
  if (kind === 'redcoat') { rbox(ctx, -44, hy - 150, 88, 110, 14, '#1d2433'); rbox(ctx, -50, hy - 52, 100, 14, 6, K.gold, 4); circle(ctx, 0, hy - 160, 14, '#fff', 4); ctx.beginPath(); ctx.moveTo(-30, hy + 20); ctx.quadraticCurveTo(-10, hy + 10, 0, hy + 20); ctx.quadraticCurveTo(10, hy + 10, 30, hy + 20); ctx.lineWidth = 8; ctx.strokeStyle = '#6a3a1a'; ctx.stroke(); }
  if (kind === 'usSoldier') { ctx.beginPath(); ctx.moveTo(-54, hy - 30); ctx.lineTo(-44, hy - 100); ctx.lineTo(50, hy - 92); ctx.lineTo(56, hy - 30); ctx.closePath(); shape(ctx, K.usBlueD); rbox(ctx, -60, hy - 40, 130, 16, 6, '#1d2433', 4); }
  if (kind === 'settlerUS') { ctx.beginPath(); ctx.ellipse(0, hy - 44, 86, 18, 0, 0, Math.PI * 2); shape(ctx, '#6a4a2a'); rbox(ctx, -44, hy - 96, 88, 56, 16, '#6a4a2a'); }
  if (kind === 'settlerUK') { rbox(ctx, -40, hy - 120, 80, 80, 8, '#2a2a33'); rbox(ctx, -62, hy - 50, 124, 14, 6, '#2a2a33'); }
  if (kind === 'kaiser') { rbox(ctx, -56, hy - 110, 112, 70, 30, '#2e3a4a'); ctx.beginPath(); ctx.moveTo(-10, hy - 110); ctx.lineTo(0, hy - 170); ctx.lineTo(10, hy - 110); ctx.closePath(); shape(ctx, K.gold, 5); circle(ctx, 0, hy - 80, 16, K.gold, 4);
    ctx.beginPath(); ctx.moveTo(-6, hy + 18); ctx.bezierCurveTo(-40, hy + 6, -60, hy - 20, -76, hy - 34); ctx.moveTo(6, hy + 18); ctx.bezierCurveTo(40, hy + 6, 60, hy - 20, 76, hy - 34); ctx.lineWidth = 12; ctx.strokeStyle = '#5a3a20'; ctx.stroke(); }
  ctx.restore();
}

// ---------- flags ----------
function usFlag(ctx, w = 300, h = 190, wave = 0, t = 0) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  for (let i = 0; i < 13; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#d63a3a'; ctx.fillRect(0, (i * h) / 13, w, h / 13 + 1); }
  ctx.fillStyle = '#2f4fa3'; ctx.fillRect(0, 0, w * 0.42, h * 0.54);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) circle(ctx, 14 + c * (w * 0.42 - 28) / 5, 14 + r * (h * 0.54 - 28) / 3, 4, '#fff', 0);
  ctx.restore(); rr(ctx, 0, 0, w, h, 4); shape(ctx, null, 6);
}
function ukFlag(ctx, w = 300, h = 190) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); ctx.fillStyle = '#24357a'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = h * 0.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
  ctx.strokeStyle = '#d63a3a'; ctx.lineWidth = h * 0.07; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(w / 2 - h * 0.17, 0, h * 0.34, h); ctx.fillRect(0, h / 2 - h * 0.17, w, h * 0.34);
  ctx.fillStyle = '#d63a3a'; ctx.fillRect(w / 2 - h * 0.1, 0, h * 0.2, h); ctx.fillRect(0, h / 2 - h * 0.1, w, h * 0.2);
  ctx.restore(); rr(ctx, 0, 0, w, h, 4); shape(ctx, null, 6);
}
function flagPole(ctx, t, which, s = 1) { ctx.save(); ctx.scale(s, s); rbox(ctx, -8, -420, 16, 420, 6, '#c9c2b6', 5); circle(ctx, 0, -424, 14, K.gold, 5); ctx.save(); ctx.translate(8, -410); ctx.transform(1, Math.sin(t * 3) * 0.04, 0, 1, 0, 0); (which === 'us' ? usFlag : ukFlag)(ctx, 220, 140); ctx.restore(); ctx.restore(); }

// ---------- props ----------
function cannon(ctx, dir = 1) {
  ctx.save(); ctx.scale(dir, 1);
  ctx.save(); ctx.rotate(-0.25); rbox(ctx, -40, -46, 230, 72, 34, '#3a3f4a'); rbox(ctx, 170, -52, 26, 84, 10, '#2a2e36'); ctx.restore();
  circle(ctx, -10, 30, 54, K.brown); circle(ctx, -10, 30, 16, K.brownD, 4); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(-10, 30); ctx.lineTo(-10 + Math.cos(a) * 50, 30 + Math.sin(a) * 50); ctx.lineWidth = 6; ctx.strokeStyle = K.ink; ctx.stroke(); }
  ctx.restore();
}
function warship(ctx, t) {
  const rock = Math.sin(t * 1.5) * 0.04; ctx.save(); ctx.rotate(rock);
  for (const [x, h] of [[-110, 300], [10, 360], [120, 260]]) { rbox(ctx, x - 7, -h, 14, h, 4, K.brownD, 5); for (const [y, w] of [[-h + 40, 110], [-h + 130, 140], [-h + 220, 130]]) if (y < -60) { rr(ctx, x - w / 2, y, w, 80, 10); shape(ctx, K.white, 5); } ctx.save(); ctx.translate(x + 7, -h); ukMini(ctx); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(-260, -60); ctx.lineTo(260, -70); ctx.quadraticCurveTo(240, 40, 170, 60); ctx.lineTo(-190, 60); ctx.quadraticCurveTo(-250, 30, -260, -60); shape(ctx, '#3a2a22');
  rbox(ctx, -230, -30, 450, 18, 4, K.gold, 0); for (let i = 0; i < 7; i++) rbox(ctx, -200 + i * 60, -2, 26, 20, 4, '#111', 0);
  ctx.restore();
}
function ukMini(ctx) { ctx.save(); ctx.scale(0.25, 0.25); ukFlag(ctx, 220, 140); ctx.restore(); }
function cabin(ctx, flag) {
  rbox(ctx, -150, -170, 300, 170, 8, '#a8743e'); for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-150, -170 + i * 28); ctx.lineTo(150, -170 + i * 28); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(29,24,70,0.4)'; ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-180, -160); ctx.lineTo(0, -280); ctx.lineTo(180, -160); ctx.closePath(); shape(ctx, '#7a4a2a');
  rbox(ctx, -36, -100, 72, 100, 6, '#5e3a20'); rbox(ctx, 70, -130, 50, 44, 4, '#ffe9a8');
  if (flag) at(ctx, 120, -280, 0.4, 0, () => (flag === 'us' ? usFlag : ukFlag)(ctx, 220, 140));
}
function potatoPatch(ctx, t, n = 7) { for (let i = 0; i < n; i++) { ellipse(ctx, -300 + i * 100, 0, 46, 20, '#7a4a2a', 5); ctx.beginPath(); ctx.moveTo(-300 + i * 100, -14); ctx.quadraticCurveTo(-310 + i * 100, -60, -290 + i * 100 + Math.sin(t * 2 + i) * 6, -80); ctx.lineWidth = 8; ctx.strokeStyle = K.grassD; ctx.stroke(); ellipse(ctx, -280 + i * 100, -70, 16, 9, K.grass, 4); } }
function bang(ctx, s = 'BANG!') { burst(ctx, 0, 0, 200, K.gold, 16, 8); burst(ctx, 0, 0, 140, '#ff8a3d', 16, 0); text(ctx, s, 0, 6, 92, K.white, { lw: 16 }); }
function scoreBoard(ctx, rows, col) { rbox(ctx, -230, -40 - rows.length * 60, 460, rows.length * 120 + 40, 26, 'rgba(255,248,238,0.95)'); rows.forEach(([n, l], i) => { text(ctx, n, -110, -rows.length * 60 + 30 + i * 120, n.length > 3 ? 72 : 96, col, { lw: 14 }); text(ctx, l, 70, -rows.length * 60 + 30 + i * 120, 40, K.ink, { lw: 0 }); }); }
function tent(ctx, col) { ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(0, -120); ctx.lineTo(90, 0); ctx.closePath(); shape(ctx, col); ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(-20, 0); ctx.lineTo(20, 0); ctx.closePath(); shape(ctx, '#3a2a22', 4); }
function campfire(ctx, t) { for (const a of [-0.5, 0.5]) { ctx.save(); ctx.rotate(a); rbox(ctx, -50, -8, 100, 16, 6, K.brown, 4); ctx.restore(); } ctx.beginPath(); const f = Math.sin(t * 14) * 6; ctx.moveTo(0, -80 - f); ctx.quadraticCurveTo(34, -20, 0, -4); ctx.quadraticCurveTo(-34, -20, 0, -80 - f); shape(ctx, '#ff9f3d', 5); ctx.beginPath(); ctx.moveTo(0, -50); ctx.quadraticCurveTo(16, -16, 0, -8); ctx.quadraticCurveTo(-16, -16, 0, -50); paint(ctx, K.gold, 0); }
function calendar(ctx, year) { rbox(ctx, -150, -170, 300, 330, 22, K.white); rbox(ctx, -150, -170, 300, 90, 22, K.ukRed); for (const x of [-80, 80]) rbox(ctx, x - 10, -194, 20, 50, 10, '#555'); text(ctx, String(year), 0, 40, 120, K.ink, { lw: 0 }); }
function throne(ctx) { rbox(ctx, -130, -420, 260, 420, 30, '#7a1f3a'); rbox(ctx, -110, -400, 220, 260, 20, '#a82a4a', 5); rbox(ctx, -150, -150, 300, 50, 14, K.gold); for (const x of [-120, 120]) circle(ctx, x, -430, 26, K.gold); }
function scroll_(ctx, s) { rbox(ctx, -170, -110, 340, 220, 10, '#efe2c2'); for (const y of [-120, 110]) rbox(ctx, -190, y - 16, 380, 32, 16, '#c9a86a'); text(ctx, s, 0, 0, 52, K.ink, { lw: 0 }); }
// map of the San Juan Islands area (stylized)
function mapScene(ctx, t, o = {}) {
  ctx.fillStyle = K.sea; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  alpha(ctx, 0.25, () => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; for (let i = 0; i < 18; i++) { const y = 200 + i * 100, x = ((i * 137 + t * 30) % 1200) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 12, x + 60, y); ctx.stroke(); } });
  // Canada (north, Vancouver Island west) and USA (south/east)
  ctx.beginPath(); ctx.moveTo(-100, 200); ctx.lineTo(1200, 200); ctx.lineTo(1200, 560); ctx.quadraticCurveTo(900, 640, 760, 560); ctx.quadraticCurveTo(620, 500, 520, 620); ctx.lineTo(-100, 620); ctx.closePath(); shape(ctx, '#f4c9c9');
  ctx.beginPath(); ctx.moveTo(-100, 700); ctx.quadraticCurveTo(160, 640, 320, 820); ctx.quadraticCurveTo(380, 980, 260, 1260); ctx.quadraticCurveTo(120, 1400, -100, 1420); ctx.closePath(); shape(ctx, '#f4c9c9');
  ctx.beginPath(); ctx.moveTo(1200, 900); ctx.quadraticCurveTo(900, 900, 820, 1100); ctx.quadraticCurveTo(760, 1300, 860, 1500); ctx.quadraticCurveTo(700, 1600, 600, 1800); ctx.lineTo(1200, 1800); ctx.closePath(); shape(ctx, '#c9dcff');
  ctx.beginPath(); ctx.moveTo(-100, 1520); ctx.quadraticCurveTo(300, 1500, 600, 1800); ctx.lineTo(-100, 1800); ctx.closePath(); shape(ctx, '#c9dcff');
  text(ctx, 'CANADA (BRITISH)', 700, 680, 44, K.ukRed, { lw: 10, stroke: K.white }); text(ctx, 'USA', 820, 1420, 64, K.usBlue, { lw: 10, stroke: K.white });
  // San Juan Island
  at(ctx, 560, 1010, 1 + (o.pulse || 0) * 0.05 * Math.sin(t * 6), 0, () => { ctx.beginPath(); ctx.moveTo(-120, -60); ctx.quadraticCurveTo(-40, -150, 60, -100); ctx.quadraticCurveTo(160, -40, 120, 60); ctx.quadraticCurveTo(60, 160, -40, 120); ctx.quadraticCurveTo(-160, 80, -120, -60); shape(ctx, o.islandCol || K.grass); });
  if (o.label !== false) text(ctx, 'SAN JUAN ISLAND', 560, 1190, 46, K.ink, { lw: 10, stroke: K.white });
}
