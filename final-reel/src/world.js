// 2026 World Cup final explainer — 3D stadium (Three.js) + flat 2D player cards + 2D overlay. Deterministic drawFrame(t).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SC = window.SCALE || 1, PW = Math.round(1080 * SC), PH = Math.round(1920 * SC);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(PW, PH, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2; renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(44, 1080 / 1920, 0.05, 3000);
const pmrem = new THREE.PMREMGenerator(renderer); const ENV = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const GLOW = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
const SHADOW = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
const hash = (i) => { const s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s); };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.7, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1, map: o.map || null, envMap: o.env || null });
function makeCard(draw, w, h, opts = {}) {
  const px = opts.px || 512, cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(px * h / w);
  const c2 = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, toneMapped: false, color: opts.tint || 0xffffff }));
  mesh.castShadow = true; mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const pivot = new THREE.Group(); pivot.add(mesh); mesh.position.y = h * 0.5; const group = new THREE.Group(); group.add(pivot);
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, w * 0.25), new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false })); cs.rotation.x = -Math.PI / 2; cs.position.y = 0.02; group.add(cs);
  const unit = opts.unit || 600, oy = opts.oy ?? 0.95;
  return { group, pivot, mesh, cs,
    update(t, st) { c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, cv.width, cv.height); c2.translate(cv.width / 2, cv.height * oy); const s = cv.width / unit; c2.scale(s, s); draw(c2, t, st || {}); tex.needsUpdate = true; },
    face(cam) { group.rotation.y = Math.atan2(cam.position.x - group.position.x, cam.position.z - group.position.z); } };
}

// =================== STADIUM ===================
const stadium = new THREE.Scene();
stadium.background = new THREE.Color(0x070a18); stadium.fog = new THREE.Fog(0x070a18, 80, 220);
const hemi = new THREE.HemisphereLight(0x8fa8ff, 0x1a3a1a, 0.9); stadium.add(hemi);
const key = new THREE.DirectionalLight(0xf2f6ff, 2.6); key.position.set(-30, 60, 20); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -40, right: 40, top: 50, bottom: -50, near: 1, far: 200 }); key.shadow.bias = -0.0004; stadium.add(key);
const fill = new THREE.DirectionalLight(0xffe6c8, 1.0); fill.position.set(30, 40, -30); stadium.add(fill);
const PITCH_W = 68, PITCH_L = 105;
const pitchTex = canvasTex(680, 1050, (x, w, h) => { for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? '#2f8f3a' : '#36a043'; x.fillRect(0, i * h / 14, w, h / 14 + 1); }
  x.strokeStyle = 'rgba(255,255,255,0.92)'; x.lineWidth = 5; x.strokeRect(20, 20, w - 40, h - 40); x.beginPath(); x.moveTo(20, h / 2); x.lineTo(w - 20, h / 2); x.stroke(); x.beginPath(); x.arc(w / 2, h / 2, 91, 0, Math.PI * 2); x.stroke();
  for (const top of [true, false]) { const y0 = top ? 20 : h - 20, s = top ? 1 : -1; x.strokeRect(w / 2 - 201, top ? y0 : y0 - 165, 402, 165); x.strokeRect(w / 2 - 92, top ? y0 : y0 - 55, 184, 55); x.beginPath(); x.arc(w / 2, y0 + s * 110, 4, 0, 7); x.fill(); } });
const pitch = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_W, PITCH_L), std(0xffffff, { map: pitchTex, r: 0.95 })); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; stadium.add(pitch);
const apron = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_W + 30, PITCH_L + 30), std(0x2a7a34, { r: 1 })); apron.rotation.x = -Math.PI / 2; apron.position.y = -0.02; apron.receiveShadow = true; stadium.add(apron);
// stands: four tilted crowd banks with painted 2D fans
const crowdTex = [1, 2].map(seed => { const t = canvasTex(1024, 512, (x, w, h) => drawCrowd(x, w, h, seed)); t.wrapS = THREE.RepeatWrapping; return t; });
function stand(len, x, z, rotY, seed) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; stadium.add(g);
  for (let tier = 0; tier < 2; tier++) { const tex = crowdTex[(seed + tier) % 2].clone(); tex.needsUpdate = true; tex.repeat.set(len / 26, 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 16), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35, roughness: 1 })); m.position.set(0, 6 + tier * 14, -6 - tier * 10); m.rotation.x = -0.62; g.add(m); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 10, 1, 14), std(0x1a1d2a)); roof.position.set(0, 30, -20); g.add(roof); return g; }
stand(130, 0, -PITCH_L / 2 - 6, 0, 0); stand(130, 0, PITCH_L / 2 + 6, Math.PI, 1); stand(160, -PITCH_W / 2 - 6, 0, Math.PI / 2, 1); stand(160, PITCH_W / 2 + 6, 0, -Math.PI / 2, 0);
// light towers
const lights = [];
for (const [x, z] of [[-48, -66], [48, -66], [-48, 66], [48, 66]]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 46, 10), std(0x3a3f4a)); pole.position.set(x, 23, z); stadium.add(pole);
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); bank.position.set(x * 0.98, 47, z * 0.98); bank.lookAt(0, 0, 0); stadium.add(bank);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xdfe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); glow.scale.set(40, 40, 1); glow.position.copy(bank.position); stadium.add(glow); lights.push({ bank, glow }); }
// goal (at the north end, z = -PITCH_L/2)
const GZ = -PITCH_L / 2, GW = 7.32, GH = 2.44, GD = 2.2;
const postMat = std(0xffffff, { r: 0.3, m: 0.2 });
for (const x of [-GW / 2, GW / 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, GH, 12), postMat); p.position.set(x, GH / 2, GZ); p.castShadow = true; stadium.add(p); }
const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, GW + 0.14, 12), postMat); bar.rotation.z = Math.PI / 2; bar.position.set(0, GH, GZ); bar.castShadow = true; stadium.add(bar);
const netGeo = new THREE.PlaneGeometry(GW, GH, 40, 14); const net = new THREE.Mesh(netGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.55 })); net.position.set(0, GH / 2, GZ - GD); stadium.add(net);
const netBase = netGeo.attributes.position.array.slice();
for (const x of [-GW / 2, GW / 2]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(GD, GH, 10, 14), net.material); side.rotation.y = Math.PI / 2; side.position.set(x, GH / 2, GZ - GD / 2); stadium.add(side); }
const roofNet = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD, 40, 10), net.material); roofNet.rotation.x = Math.PI / 2; roofNet.position.set(0, GH, GZ - GD / 2); stadium.add(roofNet);
function bulgeNet(k, cx = 0.6, cy = 0.9) { const p = netGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = netBase[i * 3], y = netBase[i * 3 + 1]; const d = Math.exp(-((x - cx) ** 2 + (y - (cy - GH / 2)) ** 2) / 0.9); p.setZ(i, -k * 1.4 * d); } p.needsUpdate = true; }
// ball
const ballTex = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1a1a'; for (let i = 0; i < 12; i++) { const cx = (i % 6) * w / 6 + (Math.floor(i / 6) ? w / 12 : 0), cy = h * (Math.floor(i / 6) ? 0.7 : 0.3); x.beginPath(); for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 - Math.PI / 2; x.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); } x.fill(); } x.fillStyle = '#d8202a'; x.fillRect(0, h * 0.48, w, 8); });
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), std(0xffffff, { map: ballTex, r: 0.4 })); ball.castShadow = true; stadium.add(ball);
const ballShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false })); ballShadow.rotation.x = -Math.PI / 2; stadium.add(ballShadow);
// big scoreboard (behind the goal, above the stand) + a copy in its own dark scene for the opening
function makeBoard() { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group(); const frame = new THREE.Mesh(new THREE.BoxGeometry(17, 9, 1), std(0x1a1d26, { m: 0.5, r: 0.4 })); g.add(frame);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = 0.51; g.add(scr);
  return { g, draw(score, clock, on = 1, flash = 0) { const x = cv.getContext('2d'); x.fillStyle = '#05060c'; x.fillRect(0, 0, 1024, 512); x.globalAlpha = on;
    x.fillStyle = '#0d1430'; x.fillRect(16, 16, 992, 480); x.font = '72px Lilita'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#d8202a'; x.fillRect(60, 60, 260, 110); x.fillStyle = '#7ec8f2'; x.fillRect(704, 60, 260, 110); x.fillStyle = '#fff'; x.fillText('ESP', 190, 118); x.fillStyle = '#1b2a5a'; x.fillText('ARG', 834, 118);
    x.font = '230px Lilita'; x.fillStyle = flash > 0 ? `rgb(255,${210 + 45 * flash | 0},${60 + 195 * flash | 0})` : '#ffd23f'; x.fillText(score, 512, 300);
    x.font = '96px Lilita'; x.fillStyle = '#ffffff'; x.fillText(clock, 512, 440); x.globalAlpha = 1; tex.needsUpdate = true; } }; }
const board = makeBoard(); board.g.position.set(0, 41, GZ - 21); stadium.add(board.g);
const boardScene = new THREE.Scene(); boardScene.background = new THREE.Color(0x000000); const board2 = makeBoard(); boardScene.add(board2.g); boardScene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));
const boardGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x6a8aff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); boardGlow.scale.set(40, 26, 1); boardGlow.position.z = -1; boardScene.add(boardGlow);
// trophy (generic gold cup — not the real trophy design)
const gold = new THREE.MeshStandardMaterial({ color: 0xffc845, metalness: 1, roughness: 0.22, envMap: ENV, envMapIntensity: 1.4 });
const trophy = new THREE.Group(); stadium.add(trophy);
{ const prof = [[0, 0], [0.32, 0], [0.32, 0.12], [0.22, 0.16], [0.12, 0.3], [0.08, 0.55], [0.1, 0.62], [0.3, 0.72], [0.36, 0.95], [0.32, 1.05], [0.3, 1.02], [0.26, 0.8], [0, 0.76]].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), gold); cup.castShadow = true; trophy.add(cup);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 10, 24, Math.PI * 1.2), gold); h.position.set(s * 0.36, 0.86, 0); h.rotation.z = s > 0 ? -Math.PI * 0.6 : Math.PI * 1.6; trophy.add(h); }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.14, 32), std(0x1a6a3a, { m: 0.2, r: 0.4 })); base.position.y = 0.07; trophy.add(base); }
trophy.scale.setScalar(1.1);
// confetti + fireworks
const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.24), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), 700); stadium.add(confetti);
const cCol = new THREE.Color(); for (let i = 0; i < 700; i++) confetti.setColorAt(i, cCol.setHex(i % 3 === 0 ? 0xffd23f : 0xd8202a));
const fw = (() => { const n = 1400, p = new Float32Array(n * 3), c = new Float32Array(n * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); const s = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, map: GLOW, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.frustumCulled = false; stadium.add(s); return s; })();
const dummy = new THREE.Object3D();
// players
const sub = makeCard(drawPlayer, 1.4, 2.3, { unit: 340, px: 512 }); stadium.add(sub.group);
const keeper = makeCard(drawPlayer, 1.5, 2.3, { unit: 340, px: 512 }); stadium.add(keeper.group);
const capESP = makeCard(drawPlayer, 1.4, 2.3, { unit: 340, px: 512 }); stadium.add(capESP.group);
const capARG = makeCard(drawPlayer, 1.4, 2.3, { unit: 340, px: 512 }); stadium.add(capARG.group);
const defs = [0, 1].map(() => { const c = makeCard(drawPlayer, 1.4, 2.3, { unit: 340, px: 384 }); stadium.add(c.group); return c; });
const champs = [0, 1, 2, 3].map(() => { const c = makeCard(drawPlayer, 1.4, 2.3, { unit: 340, px: 384 }); stadium.add(c.group); return c; });

// =================== camera / composer ===================
const composers = {};
function composerFor(scene, k) { if (composers[k]) return composers[k]; const c = new EffectComposer(renderer); c.setPixelRatio(1); c.setSize(PW, PH); c.addPass(new RenderPass(scene, camera)); const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.0015, maxblur: 0.008 }); c.addPass(bokeh); c.addPass(new OutputPass()); return (composers[k] = { c, bokeh }); }
function camKeys(t, keys) { let a = keys[0], b = keys[keys.length - 1]; for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i][0] && t <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; } if (t > keys[keys.length - 1][0]) a = b; const k = a === b ? 0 : E.inOutCubic(seg(t, a[0], b[0])); return [a[1].map((v, i) => lerp(v, b[1][i], k)), a[2].map((v, i) => lerp(v, b[2][i], k))]; }
function setCam(p, l) { camera.position.set(...p); camera.lookAt(...l); }
let A = null;
function anchors() { if (A) return A; const w = (i, x, af) => T(i, x, af), s = i => SEC(i).start;
  A = { s1: s(1), s2: s(2), s3: s(3), s4: s(4), end: BEATS.duration, zero: w(0, 'Zero'), th106: w(0, '106th'), final: w(1, 'World'), spain: w(1, 'Spain'),
    then: w(3, 'Then...'), ferran: w(3, 'Ferran'), struck: w(3, 'struck'), min106: w(3, '106th'), won: w(4, 'won'), lifted: w(4, 'lifted'), since: w(4, 'since') }; return A; }

// =================== frame ===================
function drawFrame(t) {
  const a = anchors(); let scene = stadium, key_ = 's', p, l, focus = 20, ap = 0.0012, flash = 0;
  const score = t > a.s4 + 0.25 ? '1 - 0' : '0 - 0';
  const clockRun = t < a.zero ? `${String(Math.min(90, Math.floor(lerp(0, 90, seg(t, 0.4, a.zero))))).padStart(2, '0')}:00` : t < a.th106 ? '90:00' : '106:00';
  // ---------- opening: the scoreboard alone in the dark ----------
  if (t < a.s1) {
    scene = boardScene; key_ = 'b'; const on = E.outCubic(seg(t, 0.15, 0.6)), fl = Math.max(0, 1 - Math.abs(t - a.th106) / 0.25);
    board2.draw('0 - 0', clockRun, on, fl); boardGlow.material.opacity = 0.5 * on + fl * 0.5;
    [p, l] = camKeys(t, [[0, [0, -1.5, 52], [0, 0, 0]], [a.th106, [0, -1, 45], [0, 0, 0]], [a.s1, [0, -0.6, 40], [0, 0, 0]]]); focus = 20; ap = 0.0005;
  } else {
    board.draw(score, t < a.s3 ? '90:00' : t < a.s4 ? "106'" : 'FT', 1, t > a.s4 && t < a.s4 + 1.2 ? Math.max(0, 1 - (t - a.s4 - 0.25) * 2) : 0);
    // reset per-frame visibility
    [sub, keeper, capESP, capARG, ...defs, ...champs].forEach(c => (c.group.visible = false)); trophy.visible = false; confetti.visible = false; fw.visible = false; ball.visible = true; bulgeNet(0);
    const boom = t > a.min106 + 0.4 ? Math.max(0, 1 - (t - a.min106 - 0.4) * 1.2) : 0;
    lights.forEach(L => { L.glow.material.opacity = 0.8 + boom * 0.6 + (t > a.s4 ? 0.2 * Math.sin(t * 9) : 0); L.glow.scale.setScalar(40 + boom * 30); }); hemi.intensity = 0.9 + boom * 1.2; flash = boom;
    if (t < a.final) { // sweep over the packed stadium
      [p, l] = camKeys(t, [[a.s1, [-60, 40, 60], [0, 4, 0]], [a.final, [-20, 22, 46], [0, 3, -5]]]); ball.position.set(0, 0.2, 0); focus = 50; ap = 0.0006;
    } else if (t < a.s2) { // the two sides at the centre circle
      capESP.group.visible = capARG.group.visible = true; capESP.group.position.set(-0.9, 0, 0); capARG.group.position.set(0.9, 0, 0);
      capESP.update(t, { team: 'esp', num: 16, mood: 'focus' }); capARG.update(t, { team: 'arg', num: 10, mood: 'focus', skin: 1, hair: 1 });
      ball.position.set(0, 0.2, 0.6);
      [p, l] = camKeys(t, [[a.final, [6, 4, 16], [0, 1.5, 0]], [a.s2, [2.2, 1.6, 7], [0, 1.3, 0]]]); focus = 7; }
    else if (t < a.s2 + (a.s3 - a.s2) / 2) { // near miss 1: off the post
      const k = seg(t, a.s2, a.s2 + 0.8), b2 = seg(t, a.s2 + 0.8, a.s2 + 1.3);
      ball.position.set(lerp(-2, GW / 2 - 0.1, k) + b2 * 2.5, 0.2 + Math.sin(k * Math.PI) * 1.4 + (k >= 1 ? 1.0 - b2 * 0.8 : 0), lerp(GZ + 14, GZ + 0.1, k) + b2 * 3);
      keeper.group.visible = true; keeper.group.position.set(-0.8, 0, GZ + 0.4); keeper.update(t, { team: 'gk', num: 23, mood: 'focus', skin: 1, hair: 2 });
      [p, l] = camKeys(t, [[a.s2, [9, 2.2, GZ + 10], [1, 1.2, GZ]], [a.s3, [8, 2.4, GZ + 9], [1, 1.2, GZ]]]); focus = 11; }
    else if (t < a.s3) { // near miss 2: diving save
      const m = a.s2 + (a.s3 - a.s2) / 2, k = seg(t, m, m + 0.5), b2 = seg(t, m + 0.5, m + 1.0);
      keeper.group.visible = true; keeper.group.position.set(lerp(0, -1.6, E.outCubic(k)), lerp(0, 0.6, Math.sin(k * Math.PI)), GZ + 0.6); keeper.update(t, { team: 'gk', num: 23, pose: k > 0.15 ? 'dive' : 'stand', mood: 'focus', skin: 1, hair: 2 });
      ball.position.set(lerp(2, -1.9, k) - b2 * 3, 0.2 + lerp(1.0, 1.5, k) + b2 * 1.2, lerp(GZ + 12, GZ + 0.7, k) + b2 * 4);
      [p, l] = camKeys(t, [[m, [-2, 1.6, GZ + 9], [-1, 1.2, GZ]], [a.s3, [-2.5, 1.6, GZ + 8.5], [-1, 1.2, GZ]]]); focus = 9; }
    else if (t < a.struck - 0.05) { // the substitute runs on, the ball bounces in the box
      sub.group.visible = true; const r = E.inOutCubic(seg(t, a.s3, a.ferran + 0.3)); sub.group.position.set(lerp(PITCH_W / 2 - 1, 3.5, r), 0, lerp(GZ + 26, GZ + 13, r));
      sub.update(t, { team: 'esp', num: 7, pose: r < 1 ? 'run' : 'stand', mood: 'focus', skin: 1, hair: 1 });
      defs.forEach((d, i) => { d.group.visible = true; d.group.position.set(-1.5 + i * 3.4, 0, GZ + 9 - i); d.update(t, { team: 'arg', num: [2, 13][i], mood: 'focus', skin: i + 2, hair: i }); });
      const bb = Math.abs(Math.sin((t - a.ferran) * 6)) * Math.max(0, 1.2 - (t - a.ferran) * 0.6); ball.position.set(2.6, 0.2 + (t > a.ferran ? bb : 0), GZ + 12);
      keeper.group.visible = true; keeper.group.position.set(0, 0, GZ + 0.5); keeper.update(t, { team: 'gk', num: 23, mood: 'focus', skin: 1, hair: 2 });
      [p, l] = camKeys(t, [[a.s3, [26, 6, GZ + 30], [10, 1.2, GZ + 18]], [a.ferran, [12, 3, GZ + 22], [3, 1.2, GZ + 12]], [a.struck, [8, 2.2, GZ + 19], [2.5, 1.0, GZ + 11]]]); focus = 10; }
    else if (t < a.s4) { // the strike, in slow motion, and the net bulges
      const k = seg(t, a.struck, a.min106 + 0.2), slow = E.inOutCubic(k);
      sub.group.visible = true; sub.group.position.set(3.2, 0, GZ + 12.4); sub.update(t, { team: 'esp', num: 7, pose: t < a.min106 + 0.3 ? 'kick' : 'cheer', kick: k * 3, mood: t < a.min106 + 0.3 ? 'focus' : 'joy', skin: 1, hair: 1 });
      keeper.group.visible = true; const dv = seg(t, a.struck + 0.3, a.struck + 1.0); keeper.group.position.set(lerp(0, 1.7, dv), Math.sin(dv * Math.PI) * 0.4, GZ + 0.5); keeper.update(t, { team: 'gk', num: 23, pose: dv > 0.1 ? 'dive' : 'stand', mood: t > a.min106 ? 'sad' : 'focus', skin: 1, hair: 2 });
      ball.position.set(lerp(2.6, 0.6, slow), lerp(0.25, 0.9, slow), lerp(GZ + 12, GZ - GD + 0.3, slow)); ball.rotation.x = -t * 12;
      bulgeNet(seg(t, a.min106 - 0.05, a.min106 + 0.35) * (1 - 0.6 * seg(t, a.min106 + 0.5, a.s4)));
      [p, l] = camKeys(t, [[a.struck, [6, 1.4, GZ + 15], [2.6, 0.6, GZ + 12]], [a.min106 - 0.2, [3, 1.5, GZ + 6], [0.6, 0.9, GZ - 1]], [a.s4, [2.4, 2.4, GZ + 7], [0.4, 1.2, GZ - 1]]]); focus = 5; }
    else if (t < a.lifted - 0.1) { // scoreboard flips to 1-0
      [p, l] = camKeys(t, [[a.s4, [0, 16, GZ + 26], [0, 40, GZ - 21]], [a.lifted, [0, 20, GZ + 18], [0, 40, GZ - 21]]]); focus = 21; ap = 0.0006; }
    else { // champions lift the trophy, confetti + fireworks
      champs.forEach((c, i) => { c.group.visible = true; c.group.position.set(-2.4 + i * 1.6, 0, 0); c.update(t, { team: 'esp', num: [3, 16, 7, 1][i], pose: i === 1 ? 'lift' : 'cheer', mood: 'joy', skin: i % 3, hair: i % 4, ph: i }); });
      trophy.visible = true; trophy.position.set(-2.4 + 1.6, 2.45 + Math.abs(Math.sin(t * 7 + 1)) * 0.16, 0.05); trophy.rotation.y = t * 0.6;
      confetti.visible = true; for (let i = 0; i < 700; i++) { const y = 14 - ((t - a.lifted) * (1.5 + hash(i) * 1.5) + hash(i + 3) * 14) % 14; dummy.position.set((hash(i + 1) - 0.5) * 14, y, (hash(i + 2) - 0.5) * 10); dummy.rotation.set(t * 3 + i, t * 2 + i, 0); dummy.updateMatrix(); confetti.setMatrixAt(i, dummy.matrix); } confetti.instanceMatrix.needsUpdate = true;
      fw.visible = true; const fp = fw.geometry.attributes.position, fc = fw.geometry.attributes.color;
      for (let i = 0; i < fp.count; i++) { const burst = i % 7, tb = a.lifted + burst * 0.45, k = ((t - tb) % 2.4 + 2.4) % 2.4 / 2.4, dir = [hash(i) - 0.5, hash(i + 9) - 0.3, hash(i + 5) - 0.5], c0 = [[1, 0.2, 0.2], [1, 0.85, 0.2], [1, 1, 1]][burst % 3];
        fp.setXYZ(i, (burst - 3) * 9 + dir[0] * 16 * k, 34 + burst % 3 * 5 + dir[1] * 16 * k - 6 * k * k, -30 + dir[2] * 16 * k); const fade = (1 - k) * (t > tb ? 1 : 0); fc.setXYZ(i, c0[0] * fade, c0[1] * fade, c0[2] * fade); }
      fp.needsUpdate = true; fc.needsUpdate = true; ball.visible = false;
      [p, l] = camKeys(t, [[a.lifted, [4, 1.6, 9], [0, 2.0, 0]], [a.end, [1.5, 2.2, 7], [-0.6, 2.4, 0]]]); focus = 7.5; }
  }
  setCam(p, l);
  [sub, keeper, capESP, capARG, ...defs, ...champs].forEach(c => c.face(camera));
  ballShadow.position.set(ball.position.x, 0.03, ball.position.z); ballShadow.visible = ball.visible && scene === stadium;
  const { c, bokeh } = composerFor(scene, key_); bokeh.uniforms.focus.value = focus; bokeh.uniforms.aperture.value = ap; c.render();
  const ctx = CTX; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(renderer.domElement, 0, 0, CANVAS.width, CANVAS.height); ctx.setTransform(SC, 0, 0, SC, 0, 0);
  // overlays
  if (t > a.s1 && t < a.s2) titleCard(ctx, 'JULY 19, 2026', 'WORLD CUP FINAL', E.outBack(seg(t, a.s1 + 0.15, a.s1 + 0.5), 1.6));
  if (t > a.spain - 0.1 && t < a.s2) { const k = E.outBack(seg(t, a.spain - 0.1, a.spain + 0.2), 1.6); ctx.save(); ctx.translate(540, 980); ctx.scale(k, k); text(ctx, 'SPAIN  vs  ARGENTINA', 0, 0, 72, '#fff', { lw: 14 }); ctx.restore(); }
  if (t > a.s2 && t < a.s3) { ctx.save(); ctx.translate(140, 300); ctx.beginPath(); ctx.roundRect(-110, -44, 360, 88, 18); ctx.fillStyle = 'rgba(10,14,30,0.85)'; ctx.fill(); text(ctx, 'ESP 0 - 0 ARG', 70, 4, 50, '#ffd23f', { lw: 0 }); ctx.restore(); }
  if (t > a.min106 && t < a.s4) { const k = E.outBack(seg(t, a.min106, a.min106 + 0.3), 1.8); ctx.save(); ctx.translate(820, 400); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-130, -70, 260, 140, 24); ctx.fillStyle = '#d8202a'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke(); text(ctx, "106'", 0, 6, 92, '#fff', { lw: 0 }); ctx.restore(); }
  if (flash) { ctx.fillStyle = `rgba(255,250,230,${0.55 * flash})`; ctx.fillRect(0, 0, W, H); }
  if (t > a.since - 0.2) titleCard(ctx, '2010  …  2026', 'SPAIN, CHAMPIONS AGAIN', E.outBack(seg(t, a.since - 0.2, a.since + 0.15), 1.6) * 1, 640);
  for (const ct of [a.s1, a.final, a.s2, a.s2 + (a.s3 - a.s2) / 2, a.s3, a.struck, a.s4, a.lifted]) { const d = 1 - Math.abs(t - ct) / 0.08; if (d > 0) { ctx.fillStyle = `rgba(0,0,0,${0.7 * d})`; ctx.fillRect(0, 0, W, H); } }
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,0.4)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  captions(ctx, t, 1430, { size: 100 });
  subscribeBtn(ctx, t, a.end - 2.0);
  ctx.fillStyle = `rgba(0,0,0,${seg(t, a.end - 0.2, a.end - 0.02)})`; ctx.fillRect(0, 0, W, H);
}
function buildCues() {
  const a = anchors(), q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  add(0.15, 'powerup', 0.5); add(0.4, 'counter', 0.4, { dur: a.zero - 0.4 }); add(a.zero + 0.1, 'heart', 0.7, { dur: a.th106 - a.zero - 0.1 }); add(a.th106, 'boom', 0.8);
  add(a.s1, 'crowd', 0.55, { dur: a.end - a.s1 }); add(a.s1 + 0.15, 'whoosh', 0.5); add(a.spain - 0.1, 'stamp', 0.5);
  add(a.s2 + 0.8, 'clank', 0.8); add(a.s2 + (a.s3 - a.s2) / 2 + 0.5, 'thud', 0.6); add(a.s2 + (a.s3 - a.s2) / 2 + 0.55, 'oohs', 0.6);
  add(a.s3, 'heart', 0.5, { dur: a.struck - a.s3 }); add(a.ferran, 'thud', 0.3); add(a.ferran + 0.5, 'thud', 0.2);
  add(a.struck, 'kick', 0.9); add(a.min106 - 0.05, 'netswish', 0.8); add(a.min106 + 0.35, 'roar', 0.9); add(a.min106 + 0.4, 'boom', 0.7);
  add(a.s4 + 0.25, 'clunk', 0.7); add(a.lifted - 0.1, 'roar', 0.7); for (let i = 0; i < 7; i++) add(a.lifted + i * 0.45, 'firework', 0.5);
  add(a.end - 2.0, 'pop', 0.6); add(a.end - 1.1, 'click', 0.7); add(a.end - 1.05, 'bell', 0.7);
  return q.sort((x, y) => x.t - y.t);
}
window.drawFrame = drawFrame;
(async () => { await document.fonts.ready; window.CUES = buildCues(); drawFrame(0.01); drawFrame(6); drawFrame(19); window.READY = true; })();
