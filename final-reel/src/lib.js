// Shared helpers: easing, shapes, palette, kinetic captions. Everything is a pure function of t.
const W = 1080, H = 1920;
const C = {
  navy: '#1d1846', ink: '#1d1846', night1: '#3a2a85', night2: '#140f3a', purple: '#6c4bd8',
  yellow: '#ffd23f', pink: '#ff5da2', cyan: '#36e2ff', orange: '#ff8a3d', green: '#4cd97b', red: '#ff4757',
  white: '#fff7ec', skin: '#ffc59a', skinD: '#f2a57a', hair: '#4a2c2a', blue: '#5b8cff', lilac: '#b79cff',
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  outCubic: k => 1 - Math.pow(1 - k, 3),
  inCubic: k => k * k * k,
  inOutCubic: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  outBack: (k, s = 1.9) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
  outElastic: k => (k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};
// pop-in scale: 0 → overshoot → 1
const pop = (t, t0, d = 0.32) => (t < t0 ? 0 : E.outBack(seg(t, t0, t0 + d)));
// visible window with pop in and quick shrink out
const life = (t, t0, t1, din = 0.3, dout = 0.18) => (t < t0 || t > t1 ? 0 : t > t1 - dout ? E.inCubic(seg(t1 - t, 0, dout)) : pop(t, t0, din));
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const hash = (n) => rng(n * 9973 + 17)();
const wob = (t, f = 1, a = 1, ph = 0) => Math.sin(t * f * Math.PI * 2 + ph) * a;

// ---- shapes (filled + outlined) ----
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function paint(ctx, fill, lw = 8, stroke = C.ink) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); } }
function circle(ctx, x, y, r, fill, lw = 8) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); paint(ctx, fill, lw); }
function ellipse(ctx, x, y, rx, ry, fill, lw = 8, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); paint(ctx, fill, lw); }
function at(ctx, x, y, s, rot, fn) { if (s <= 0.001) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s); fn(); ctx.restore(); }
function alpha(ctx, a, fn) { if (a <= 0.001) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
function star(ctx, x, y, r, fill, lw = 6, pts = 5, inner = 0.45, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) { const rad = i % 2 ? r * inner : r, a = rot + (i * Math.PI) / pts; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  ctx.closePath(); paint(ctx, fill, lw);
}
function burst(ctx, x, y, r, fill, pts = 14, lw = 8, rot = 0) { star(ctx, x, y, r, fill, lw, pts, 0.72, rot); }
function sparkle(ctx, x, y, r, fill = C.yellow) { star(ctx, x, y, r, fill, 0, 4, 0.28, 0); }
function text(ctx, s, x, y, size, fill, o = {}) {
  ctx.font = `${o.weight || ''} ${size}px ${o.font || 'Lilita'}`.trim();
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.lw !== 0) { ctx.lineWidth = o.lw || size * 0.2; ctx.strokeStyle = o.stroke || C.ink; ctx.lineJoin = 'round';
    if (o.shadow !== false) { ctx.fillStyle = o.stroke || C.ink; ctx.fillText(s, x, y + size * 0.1); ctx.strokeText(s, x, y + size * 0.1); }
    ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
function zzz(ctx, x, y, t, a = 1) {
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.7 + i / 3) % 1);
    alpha(ctx, a * Math.sin(k * Math.PI), () => text(ctx, 'Z', x + k * 90 + wob(t, 0.8, 12, i), y - k * 170, 46 + i * 14 + k * 20, C.white, { lw: 8 }));
  }
}
function speedLines(ctx, t, cx, cy, a, color = 'rgba(255,255,255,0.5)') {
  alpha(ctx, a, () => {
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    const r = rng(Math.floor(t * 12) + 3);
    for (let i = 0; i < 40; i++) {
      const ang = r() * Math.PI * 2, r0 = 520 + r() * 300, len = 120 + r() * 300;
      ctx.lineWidth = 4 + r() * 10; ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); ctx.lineTo(cx + Math.cos(ang) * (r0 + len), cy + Math.sin(ang) * (r0 + len)); ctx.stroke();
    }
  });
}

// ---- beats access ----
const norm = w => w.toUpperCase().replace(/[^\w:'-]/g, '');
const SEC = i => BEATS.sections[i];
// first word matching `w` in section i (after optional time `after`) → {t0,t1}
function W_(i, w, after = 0) {
  for (const p of SEC(i).phrases) for (const x of p.words) if (x.t0 >= after && norm(x.w) === norm(w)) return x;
  throw new Error(`word ${w} not in section ${i}`);
}
const T = (i, w, after) => W_(i, w, after).t0;

// ---- kinetic captions ----
const KEY = {
  '90': '#ffd23f', ZERO: '#ffd23f', GOALS: '#ffd23f', '106TH': '#ffd23f', MINUTE: '#ffd23f', JULY: '#ffd23f', '19': '#ffd23f', '2026': '#ffd23f', WORLD: '#ffd23f', CUP: '#ffd23f', FINAL: '#ffd23f',
  SPAIN: '#ff4d55', ARGENTINA: '#8fd6ff', NEITHER: '#8fd6ff', SUBSTITUTE: '#ff4d55', FERRAN: '#ff4d55', TORRES: '#ff4d55', STRUCK: '#ffd23f', WON: '#ff4d55', '1-0': '#ffd23f', SECOND: '#ffd23f', '2010': '#ffd23f',
};
const KEY_ONLY = { WORLD: [1, 4], CUP: [1, 4], MINUTE: [0, 3] };
function keyColor(w, si) {
  const n = norm(w).replace(/[\u201c\u201d]/g, ''), c = KEY[n]; if (!c) return null;
  const only = KEY_ONLY[n]; return !only || only.includes(si) ? c : null;
}
// split phrases into caption groups of ≤ 4–5 words
function captionGroups() {
  const groups = [];
  BEATS.sections.forEach((s, si) => s.phrases.forEach(p => {
    // ≤ 4 words per group, balanced; never split "2:00 AM"
    const n = p.words.length, k = Math.ceil(n / 4), per = Math.ceil(n / k);
    let g = 0;
    while (g < n) { let e = Math.min(n, g + per); if (e < n && norm(p.words[e].w) === 'AM') e++; groups.push({ si, who: p.who, words: p.words.slice(g, e), secEnd: s.end }); g = e; }
  }));
  // a word that starts < 0.2 s before the next group would flash by: move it into the next group (same phrase only)
  for (let i = 0; i < groups.length - 1; i++) {
    const g = groups[i], n = groups[i + 1];
    const lastW = g.words[g.words.length - 1];
    if (g.words.length > 1 && n.si === g.si && !/[.?!]$/.test(lastW.w) && n.words[0].t0 - lastW.t0 < 0.2) {
      n.words.unshift(g.words.pop());
      if (norm(lastW.w) === 'AM' && g.words.length > 1) n.words.unshift(g.words.pop()); // keep "2:00 AM" together
    }
  }
  groups.forEach((g, i) => {
    const next = groups[i + 1], last = g.words[g.words.length - 1];
    g.t0 = g.words[0].t0 - 0.06;
    g.t1 = Math.min(next ? next.words[0].t0 - 0.06 : 99, next ? last.t1 + 1.3 : g.secEnd - 0.55, g.secEnd - 0.12);
  });
  return groups;
}
let GROUPS = null;
function captions(ctx, t, cy = 470, opts = {}) {
  GROUPS = GROUPS || captionGroups();
  const g = GROUPS.find(g => t >= g.t0 && t < g.t1); if (!g) return;
  const base = opts.size || 96, maxW = 920;
  // measure + wrap
  const items = g.words.map((w, i) => {
    const col = keyColor(w.w, g.si), size = (col ? base * 1.3 : base) ;
    ctx.font = `${size}px Lilita`;
    return { ...w, col, size, w_: ctx.measureText(w.w.toUpperCase()).width, i };
  });
  const lines = []; let cur = [], cw = 0; const gap = 22;
  for (const it of items) { if (cur.length && cw + gap + it.w_ > maxW) { lines.push(cur); cur = []; cw = 0; } cw += (cur.length ? gap : 0) + it.w_; cur.push(it); }
  if (cur.length) lines.push(cur);
  const lh = lines.map(l => Math.max(...l.map(x => x.size)) * 1.05);
  let y = cy - lh.reduce((a, b) => a + b, 0) / 2;
  const out = t > g.t1 - 0.1 ? E.inCubic(seg(g.t1 - t, 0, 0.1)) : 1;
  lines.forEach((l, li) => {
    const lw = l.reduce((a, x) => a + x.w_, 0) + gap * (l.length - 1);
    let x = W / 2 - lw / 2; y += lh[li] / 2;
    for (const it of l) {
      const r = rng(Math.round(it.t0 * 1000)), rot = (r() - 0.5) * 0.12 + (it.col ? wob(t, 1.3, 0.035, it.i) : 0);
      const s = pop(t, it.t0 - 0.04, it.col ? 0.34 : 0.24) * out;
      at(ctx, x + it.w_ / 2, y + (1 - s) * 30, s, rot, () => text(ctx, it.w.toUpperCase(), 0, 0, it.size, it.col || (g.who === 'boss' ? '#ffb3a8' : g.who === 'you' ? '#a8f0ff' : C.white), { lw: it.size * 0.2, font: 'Lilita' }));
      x += it.w_ + gap;
    }
    y += lh[li] / 2;
  });
}
