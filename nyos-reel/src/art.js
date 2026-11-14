// Lake Nyos art: moody night palette, flat shapes, soft glows. Respectful: silhouettes and symbols only.
const N_ = {
  sky1: '#0b1426', sky2: '#16304a', hill1: '#13283a', hill2: '#0e1f2e', hill3: '#1b3a4a', water: '#1f5a6e', waterD: '#0b2533', waterL: '#4fa3b3',
  hut: '#6b4a32', hutD: '#4a3222', roof: '#8a6a3a', roofD: '#5e4626', light: '#ffcf7a', gas: 'rgba(200,235,190,', red: '#ff5a4f', teal: '#5fe0d0', yellow: '#ffd166', o2: '#ff6b6b', c: '#5b6470',
};
const Fl = (ctx, c) => { ctx.fillStyle = c; ctx.fill(); };
function bx(ctx, x, y, w, h, r, fill) { rr(ctx, x, y, w, h, r); Fl(ctx, fill); }
function softGlow(ctx, x, y, r, col, a = 1) { alpha(ctx, a, () => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }); }
function lbl(ctx, s, x, y, size, col, o = {}) { text(ctx, s, x, y, size, col, { lw: 0, font: o.font || 'Anton', align: o.align, weight: o.weight }); }

const STARS_ = (() => { const r = rng(17); return Array.from({ length: 90 }, () => ({ x: r() * 1300 - 110, y: r() * 1100, s: 1.5 + r() * 3, p: r() * 6 })); })();
function nightSky(ctx, t, dawn = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, 1500);
  g.addColorStop(0, `rgb(${lerp(11, 70, dawn) | 0},${lerp(20, 90, dawn) | 0},${lerp(38, 140, dawn) | 0})`);
  g.addColorStop(0.7, `rgb(${lerp(22, 240, dawn) | 0},${lerp(48, 160, dawn) | 0},${lerp(74, 120, dawn) | 0})`);
  g.addColorStop(1, `rgb(${lerp(30, 255, dawn) | 0},${lerp(60, 200, dawn) | 0},${lerp(80, 140, dawn) | 0})`);
  ctx.fillStyle = g; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  alpha(ctx, 1 - dawn, () => STARS_.forEach(s => alpha(ctx, 0.4 + 0.6 * Math.abs(Math.sin(t * 1.1 + s.p)), () => circle(ctx, s.x, s.y, s.s, '#e8f1ff', 0))));
}
function moon(ctx, x, y, r = 60, a = 1) { alpha(ctx, a, () => { softGlow(ctx, x, y, r * 3, 'rgba(230,240,255,0.25)'); circle(ctx, x, y, r, '#eef3ff', 0); ctx.globalCompositeOperation = 'destination-out'; circle(ctx, x + r * 0.45, y - r * 0.2, r * 0.9, '#000', 0); ctx.globalCompositeOperation = 'source-over'; }); }
function hillLayer(ctx, y, amp, col, f, off) { ctx.beginPath(); ctx.moveTo(-500, H + 400); ctx.lineTo(-500, y); for (let x = -500; x <= W + 500; x += 30) ctx.lineTo(x, y + Math.sin((x + off) * f) * amp + Math.sin((x + off) * f * 2.7) * amp * 0.35); ctx.lineTo(W + 500, H + 400); ctx.closePath(); Fl(ctx, col); }
// crater lake landscape: lake on the left-high, village down the valley on the right
function landscape(ctx, t, o = {}) {
  nightSky(ctx, t, o.dawn || 0);
  if (!o.dawn) moon(ctx, 820, 420, 54);
  else softGlow(ctx, 540, 1150, 700, `rgba(255,190,110,${0.5 * o.dawn})`);
  hillLayer(ctx, 900, 50, o.dawn ? '#3a4a5a' : N_.hill3, 0.004, 0);
  // crater rim + lake
  ctx.beginPath(); ctx.moveTo(-200, 1100); ctx.quadraticCurveTo(80, 860, 420, 900); ctx.quadraticCurveTo(620, 920, 700, 1060); ctx.lineTo(700, H); ctx.lineTo(-200, H); ctx.closePath(); Fl(ctx, o.dawn ? '#2c3a44' : N_.hill1);
  ctx.beginPath(); ctx.ellipse(250, 980, 250, 56, -0.05, 0, Math.PI * 2); Fl(ctx, o.lakeCol || N_.water);
  alpha(ctx, 0.5, () => { for (let i = 0; i < 6; i++) { const y = 960 + i * 8; ctx.beginPath(); ctx.ellipse(250 + Math.sin(t + i) * 20, y, 160 - i * 20, 3, 0, 0, Math.PI * 2); Fl(ctx, N_.waterL); } });
  if (!o.dawn) alpha(ctx, 0.6, () => { ctx.beginPath(); ctx.ellipse(180, 975, 18, 8, 0, 0, Math.PI * 2); Fl(ctx, '#eef3ff'); });
  // valley slope down to the village
  ctx.beginPath(); ctx.moveTo(420, 1000); ctx.quadraticCurveTo(700, 1080, 900, 1330); ctx.lineTo(1400, 1380); ctx.lineTo(1400, H); ctx.lineTo(420, H); ctx.closePath(); Fl(ctx, o.dawn ? '#34444e' : N_.hill2);
  hillLayer(ctx, 1450, 20, o.dawn ? '#26323a' : '#0a1822', 0.006, 200);
}
function hut(ctx, t, lit = 1, s = 1) {
  ctx.save(); ctx.scale(s, s);
  bx(ctx, -70, -110, 140, 110, 10, N_.hut); alpha(ctx, 0.25, () => bx(ctx, 20, -110, 50, 110, 0, '#000'));
  ctx.beginPath(); ctx.moveTo(-95, -100); ctx.lineTo(0, -210); ctx.lineTo(95, -100); ctx.closePath(); Fl(ctx, N_.roof);
  alpha(ctx, 0.3, () => { ctx.beginPath(); ctx.moveTo(0, -210); ctx.lineTo(95, -100); ctx.lineTo(30, -100); ctx.closePath(); Fl(ctx, '#000'); });
  bx(ctx, -24, -70, 34, 70, 6, '#2a1a10');
  bx(ctx, 26, -82, 30, 28, 4, lit > 0.05 ? N_.light : '#22180f');
  if (lit > 0.05) softGlow(ctx, 41, -68, 80, `rgba(255,207,122,${0.5 * lit})`);
  ctx.restore();
}
function village(ctx, t, lights = [], x0 = 820, y0 = 1400) {
  const pos = [[0, 0, 1], [-170, 40, 0.9], [150, 30, 0.95], [-60, 110, 1.05], [240, 120, 1], [-260, 150, 0.9]];
  pos.forEach(([dx, dy, s], i) => at(ctx, x0 + dx, y0 + dy, s, 0, () => hut(ctx, t, lights[i] ?? 1)));
}
// bedroom interior with a peaceful sleeper (silhouette)
function sleeper(ctx, t, o = {}) {
  bx(ctx, -360, -40, 720, 80, 20, '#3a2c22'); bx(ctx, -360, -160, 40, 200, 10, '#3a2c22');
  bx(ctx, -320, -70, 640, 40, 16, '#d8d2c6');
  const br = Math.sin(t * 1.2) * 4 * (o.breathe ?? 1);
  ctx.beginPath(); ctx.moveTo(-200, -60); ctx.quadraticCurveTo(-60, -130 - br, 120, -100 - br); ctx.quadraticCurveTo(300, -90, 330, -40); ctx.lineTo(-200, -40); ctx.closePath(); Fl(ctx, o.blanket || '#3f6f8a');
  bx(ctx, -300, -110, 110, 50, 20, '#efe9dd'); circle(ctx, -240, -112, 40, o.skin || '#7a5236', 0);
  ctx.beginPath(); ctx.arc(-226, -114, 9, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = '#2a1a10'; ctx.stroke();
}
function windowNight(ctx, t, w = 300, h = 360) {
  bx(ctx, -w / 2 - 16, -h / 2 - 16, w + 32, h + 32, 12, '#3a2c22');
  ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, 6); ctx.clip(); nightSkyLocal(ctx, t, w, h); ctx.restore();
  bx(ctx, -6, -h / 2, 12, h, 0, '#3a2c22'); bx(ctx, -w / 2, -6, w, 12, 0, '#3a2c22');
}
function nightSkyLocal(ctx, t, w, h) { const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, N_.sky1); g.addColorStop(1, N_.sky2); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h); for (let i = 0; i < 12; i++) circle(ctx, -w / 2 + ((i * 97) % w), -h / 2 + ((i * 57) % h), 2.5, '#e8f1ff', 0); moon(ctx, w * 0.2, -h * 0.2, 34); }
function airParticles(ctx, t, n, col, a = 1, region = [0, 300, W, 1500]) {
  const r = rng(23);
  for (let i = 0; i < n; i++) { const x = region[0] + r() * region[2], y = region[1] + r() * region[3], ph = r() * 6; alpha(ctx, a * (0.4 + 0.6 * Math.abs(Math.sin(t + ph))), () => circle(ctx, x + Math.sin(t * 0.5 + ph) * 30, y + Math.cos(t * 0.4 + ph) * 20, 4, col, 0)); }
}
function crossIcon(ctx, r = 110) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.lineWidth = r * 0.16; ctx.strokeStyle = N_.red; ctx.stroke(); }
function virusIcon(ctx) { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 50, Math.sin(a) * 50); ctx.lineTo(Math.cos(a) * 78, Math.sin(a) * 78); ctx.lineWidth = 10; ctx.strokeStyle = '#7fd36a'; ctx.stroke(); circle(ctx, Math.cos(a) * 82, Math.sin(a) * 82, 11, '#7fd36a', 0); } circle(ctx, 0, 0, 56, '#5fb34a', 0); }
function quakeIcon(ctx) { bx(ctx, -90, -10, 180, 80, 10, '#8a6a4a'); ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 20); ctx.lineTo(-6, 40); ctx.lineTo(14, 70); ctx.lineWidth = 10; ctx.strokeStyle = '#1a1208'; ctx.stroke(); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 110, -40); ctx.lineTo(s * 130, -20); ctx.moveTo(s * 110, -10); ctx.lineTo(s * 135, 0); ctx.lineWidth = 6; ctx.strokeStyle = N_.yellow; ctx.stroke(); } }
// stylized Africa outline with Cameroon pin
const AFRICA = [[-60, -330], [60, -340], [150, -300], [170, -250], [230, -230], [300, -110], [330, -60], [280, 0], [230, 60], [210, 160], [140, 260], [90, 330], [30, 340], [0, 270], [-30, 160], [-40, 60], [-80, 0], [-170, -20], [-250, -60], [-280, -140], [-230, -240], [-150, -300]];
function africa(ctx, k = 1) {
  ctx.beginPath(); AFRICA.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); Fl(ctx, '#21405a'); ctx.lineWidth = 4; ctx.strokeStyle = '#4f87a6'; ctx.stroke();
  // Cameroon (rough wedge near the Gulf of Guinea bend)
  ctx.beginPath(); ctx.moveTo(-20, -60); ctx.lineTo(20, -110); ctx.lineTo(40, -40); ctx.lineTo(20, 0); ctx.lineTo(-30, -10); ctx.closePath(); Fl(ctx, N_.yellow);
}
function pin(ctx, col = N_.red) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-40, -50, -40, -100, 0, -100); ctx.bezierCurveTo(40, -100, 40, -50, 0, 0); Fl(ctx, col); circle(ctx, 0, -66, 14, '#fff', 0); }
// lake cross-section (local: width 900, surface at y=0)
function lakeSection(ctx, t, gas, o = {}) {
  ctx.beginPath(); ctx.moveTo(-520, -40); ctx.lineTo(-450, 0); ctx.quadraticCurveTo(-300, 520, 0, 560); ctx.quadraticCurveTo(300, 520, 450, 0); ctx.lineTo(520, -40); ctx.lineTo(560, 700); ctx.lineTo(-560, 700); ctx.closePath(); Fl(ctx, '#2a2420');
  ctx.save(); ctx.beginPath(); ctx.moveTo(-450, 0); ctx.quadraticCurveTo(-300, 520, 0, 560); ctx.quadraticCurveTo(300, 520, 450, 0); ctx.closePath(); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, '#2b7c8e'); g.addColorStop(0.5, '#164357'); g.addColorStop(1, '#081a24'); ctx.fillStyle = g; ctx.fillRect(-460, -10, 920, 580);
  // dissolved CO2 layer at the bottom
  const lay = 120 + gas * 260;
  const gg = ctx.createLinearGradient(0, 560 - lay, 0, 560); gg.addColorStop(0, 'rgba(184,240,160,0)'); gg.addColorStop(1, `rgba(184,240,160,${0.15 + 0.35 * gas})`); ctx.fillStyle = gg; ctx.fillRect(-460, 560 - lay, 920, lay);
  const r = rng(6); for (let i = 0; i < 90; i++) { const x = (r() - 0.5) * 760, y = 560 - r() * lay, ph = r() * 6; alpha(ctx, clamp(gas * 1.6 - r() * 0.6), () => circle(ctx, x + Math.sin(t * 2 + ph) * 4, y + (o.rise ? -((t * 300 + ph * 80) % 560) * o.rise : 0), 3 + (i % 3) * 2, '#c8f0b0', 0)); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-450, 0); ctx.lineTo(450, 0); ctx.lineWidth = 4; ctx.strokeStyle = '#8fd8e6'; ctx.stroke();
}
function gauge(ctx, k) {
  circle(ctx, 0, 0, 120, '#0e1a24', 0); ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.lineWidth = 10; ctx.strokeStyle = '#8fa3b3'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 20, 86, Math.PI * 0.85, Math.PI * 0.85 + Math.PI * 1.3 * 0.7); ctx.lineWidth = 16; ctx.strokeStyle = '#3a6a7a'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 20, 86, Math.PI * 0.85 + Math.PI * 1.3 * 0.7, Math.PI * 2.15); ctx.strokeStyle = N_.red; ctx.stroke();
  ctx.save(); ctx.translate(0, 20); ctx.rotate(Math.PI * 0.85 + Math.PI * 1.3 * k + Math.PI / 2); bx(ctx, -5, -84, 10, 90, 5, '#ffffff'); ctx.restore(); circle(ctx, 0, 20, 12, '#fff', 0);
  lbl(ctx, 'PRESSURE', 0, 78, 30, '#cfe3ee');
}
// the gas cloud: soft translucent blobs with a dashed "invisible" outline
function gasCloud(ctx, t, pts, a = 1, dashed = true) {
  alpha(ctx, a, () => {
    pts.forEach(([x, y, r], i) => softGlow(ctx, x, y, r * 1.4, 'rgba(200,235,190,0.22)'));
    if (dashed) { ctx.save(); ctx.setLineDash([18, 16]); ctx.lineDashOffset = -t * 40; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(220,245,210,0.75)'; pts.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }); ctx.restore(); }
  });
}
function o2Mol(ctx) { circle(ctx, -22, 0, 26, N_.o2, 0); circle(ctx, 22, 0, 26, N_.o2, 0); alpha(ctx, 0.4, () => circle(ctx, -28, -8, 8, '#fff', 0)); }
function co2Mol(ctx) { circle(ctx, -46, 0, 24, N_.o2, 0); circle(ctx, 46, 0, 24, N_.o2, 0); circle(ctx, 0, 0, 30, N_.c, 0); alpha(ctx, 0.35, () => circle(ctx, -6, -10, 8, '#fff', 0)); }
function o2Meter(ctx, k) {
  bx(ctx, -70, -320, 140, 640, 40, '#0e1a24'); rr(ctx, -70, -320, 140, 640, 40); ctx.lineWidth = 6; ctx.strokeStyle = '#8fa3b3'; ctx.stroke();
  const h = 600 * k; bx(ctx, -54, 300 - h, 108, h, 28, k > 0.5 ? N_.teal : N_.red);
  lbl(ctx, 'O₂', 0, -380, 64, '#cfe3ee'); lbl(ctx, `${Math.round(21 * k)}%`, 0, 380, 64, k > 0.5 ? N_.teal : N_.red);
}
function oilLamp(ctx, t, flame) {
  ctx.beginPath(); ctx.ellipse(0, 0, 60, 26, 0, 0, Math.PI * 2); Fl(ctx, '#8a5a32'); bx(ctx, -16, -30, 32, 30, 6, '#6a4222');
  if (flame > 0.02) { softGlow(ctx, 0, -70, 120 * flame, `rgba(255,190,90,${0.6 * flame})`); ctx.save(); ctx.translate(0, -34); ctx.scale(flame, flame); ctx.beginPath(); ctx.moveTo(0, -70 - Math.sin(t * 13) * 6); ctx.quadraticCurveTo(26, -20, 0, 0); ctx.quadraticCurveTo(-26, -20, 0, -70 - Math.sin(t * 13) * 6); Fl(ctx, '#ffcf6a'); ctx.restore(); }
  else alpha(ctx, 0.7, () => { ctx.beginPath(); ctx.moveTo(0, -40); ctx.bezierCurveTo(20, -80, -20, -110, 6, -160 - (t % 1) * 20); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(200,200,200,0.5)'; ctx.stroke(); });
}
function personIcon(ctx, col) { circle(ctx, 0, -34, 13, col, 0); ctx.beginPath(); ctx.moveTo(-18, 20); ctx.quadraticCurveTo(-18, -16, 0, -16); ctx.quadraticCurveTo(18, -16, 18, 20); ctx.closePath(); Fl(ctx, col); }
function cowIcon(ctx, col) { bx(ctx, -50, -36, 100, 46, 18, col); circle(ctx, 56, -40, 20, col, 0); for (const x of [-38, -16, 18, 38]) bx(ctx, x - 5, 4, 10, 28, 4, col); ctx.beginPath(); ctx.moveTo(50, -58); ctx.lineTo(44, -72); ctx.moveTo(64, -58); ctx.lineTo(70, -72); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke(); }
function pipeFountain(ctx, t, k) {
  // pipe from the bottom of the lake section up through the surface, spraying a fountain
  bx(ctx, -16, -40, 32, 560, 8, '#c9d3dc'); alpha(ctx, 0.3, () => bx(ctx, 6, -40, 10, 560, 4, '#000'));
  bx(ctx, -70, -10, 140, 26, 10, '#e9a23b');
  const r = rng(4);
  for (let i = 0; i < 40; i++) { const ph = r(), life_ = ((t * 0.9 + ph) % 1), ang = -Math.PI / 2 + (r() - 0.5) * 0.5, sp = 600 + r() * 300;
    const x = Math.cos(ang) * sp * life_, y = -40 + Math.sin(ang) * sp * life_ + 900 * life_ * life_;
    alpha(ctx, k * (1 - life_), () => circle(ctx, x, y, 5 + r() * 7, i % 3 ? '#cfefff' : '#c8f0b0', 0)); }
  for (let i = 0; i < 14; i++) { const y = 500 - ((t * 260 + i * 40) % 540); alpha(ctx, k * 0.8, () => circle(ctx, Math.sin(i + t) * 4, y, 5, '#c8f0b0', 0)); }
}
