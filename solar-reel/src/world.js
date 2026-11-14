// "Why solar homes go dark in a blackout" — 3D world (Three.js) + flat 2D cards + 2D overlay. Deterministic drawFrame(t).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const SC = window.SCALE || 1, PW = Math.round(1080 * SC), PH = Math.round(1920 * SC);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(PW, PH, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25; renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.05, 2000);

// ---------- helpers ----------
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const GLOW = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
const SHADOW = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
const CELLS = canvasTex(256, 384, (x, w, h) => { x.fillStyle = '#1c3a78'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) { x.fillStyle = '#244a96'; x.fillRect(4 + i * 42, 4 + j * 42, 38, 38); x.fillStyle = 'rgba(200,220,255,0.55)'; x.fillRect(4 + i * 42, 4 + j * 42 + 18, 38, 2); } x.fillStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w * 0.6, 0); x.lineTo(0, h * 0.5); x.fill(); });
const hash = (i) => { const s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s); };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.7, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, map: o.map || null, transparent: !!o.op, opacity: o.op ?? 1 });
function box(w, h, d, mat, cast = true) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = cast; m.receiveShadow = true; return m; }

// flat 2D card (billboard for characters, fixed for faces on objects)
function makeCard(draw, w, h, opts = {}) {
  const px = opts.px || 640, cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(px * h / w);
  const c2 = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); mesh.castShadow = !!opts.shadow;
  if (opts.shadow) mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const pivot = new THREE.Group(); pivot.add(mesh); mesh.position.y = h * (opts.anchor ?? 0.5);
  const group = new THREE.Group(); group.add(pivot);
  let cs = null; if (opts.contact) { cs = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, w * 0.25), new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false })); cs.rotation.x = -Math.PI / 2; cs.position.y = 0.01; group.add(cs); }
  const unit = opts.unit || 600, oy = opts.oy ?? 0.5;
  return { group, pivot, mesh, mat,
    update(t, st) { c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, cv.width, cv.height); c2.translate(cv.width / 2, cv.height * oy); const s = cv.width / unit; c2.scale(s, s); draw(c2, t, st || {}); tex.needsUpdate = true; },
    face(cam) { group.rotation.y = Math.atan2(cam.position.x - group.position.x, cam.position.z - group.position.z); } };
}
// glowing particle flow along a polyline. mode 'dc' (one way), 'ac' (back & forth wave), 'rev' (reverse dc)
function makeFlow(scene, pts, n, color, size = 0.22) {
  const P = pts.map(p => new THREE.Vector3(...p)); const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
  const pos = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, map: GLOW, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pts_ = new THREE.Points(g, mat); pts_.frustumCulled = false; scene.add(pts_);
  const at = (s) => { s = ((s % 1) + 1) % 1; const d = s * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return P[i - 1].clone().lerp(P[i], k); };
  return { pts: pts_, mat,
    set(t, mode, on = 1, speed = 0.25) {
      pts_.visible = on > 0.01; mat.opacity = on; if (!pts_.visible) return;
      for (let i = 0; i < n; i++) { let s = i / n, off = 0;
        if (mode === 'dc') s += t * speed; else if (mode === 'rev') s -= t * speed;
        else { s += Math.sin(t * Math.PI * 2 * 1.2) * 0.04; off = Math.sin(s * 40 + t * 6) * 0.12; }
        const v = at(s); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y + off; pos[i * 3 + 2] = v.z; }
      g.attributes.position.needsUpdate = true; } };
}

// =================== STREET ===================
const street = new THREE.Scene();
const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x6a8a4a, 1.3); street.add(hemi);
const sunL = new THREE.DirectionalLight(0xfff2d6, 3.2); sunL.position.set(-14, 26, 18); sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048);
Object.assign(sunL.shadow.camera, { left: -26, right: 26, top: 22, bottom: -14, near: 1, far: 90 }); sunL.shadow.bias = -0.0004; sunL.shadow.normalBias = 0.03; street.add(sunL);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std(0x7cc46a, { r: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; street.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 7), std(0x50555e, { r: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 11); road.receiveShadow = true; street.add(road);
for (let i = -20; i < 20; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.18), std(0xf2f2f2)); m.rotation.x = -Math.PI / 2; m.position.set(i * 4, 0.02, 11); street.add(m); }
const walk = new THREE.Mesh(new THREE.PlaneGeometry(200, 2), std(0xd8d4cc)); walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0.015, 6.6); walk.receiveShadow = true; street.add(walk);
const HOUSES = [[-17, 0xf2c4a0], [-8.5, 0xa8d0f0], [0, 0xfff0c8], [8.5, 0xc8e8b0], [17, 0xf0b8c8]];
const windows = [];
function house(x, col, hero) {
  const g = new THREE.Group(); g.position.set(x, 0, 0); street.add(g);
  const body = box(6.4, 4, 6, std(col, { r: 0.85 })); body.position.y = 2; g.add(body);
  const sh = new THREE.Shape(); sh.moveTo(-3.6, 0); sh.lineTo(0, 2.6); sh.lineTo(3.6, 0); sh.lineTo(-3.6, 0);
  const rg = new THREE.ExtrudeGeometry(sh, { depth: 7.2, bevelEnabled: false }); rg.translate(0, 0, -3.6); rg.rotateY(Math.PI / 2);
  const roof = new THREE.Mesh(rg, std(hero ? 0x8a4a3a : [0x9a5a4a, 0x6a6a7a, 0x8a5a3a][Math.abs(x) % 3 | 0], { r: 0.8 })); roof.position.y = 4; roof.castShadow = roof.receiveShadow = true; g.add(roof);
  const door = box(1.1, 2.1, 0.08, std(0x7a4a2a)); door.position.set(-1.6, 1.05, 3.02); g.add(door);
  for (const [wx, wy] of [[0.8, 2.3], [2.3, 2.3]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), std(0x22283a, { e: 0xffc86a, ei: 0 })); w.position.set(wx, wy, 3.02); g.add(w); windows.push({ m: w, hero, x }); const fr = box(1.25, 0.1, 0.1, std(0xffffff)); fr.position.set(wx, wy - 0.6, 3.05); g.add(fr); }
  return g;
}
const houses = HOUSES.map(([x, c]) => house(x, c, x === 0));
const hero = houses[2];
// solar panels on the front roof slope (south, +z), on tilted rails
const slope = Math.atan2(2.6, 3.6);
const panelRig = new THREE.Group(); panelRig.position.set(0, 4 + 1.32, 1.75); panelRig.rotation.x = -(Math.PI / 2 - slope) + 0.12; hero.add(panelRig);
const panelMat = new THREE.MeshStandardMaterial({ map: CELLS, roughness: 0.25, metalness: 0.4 });
const panels = [];
for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const p = new THREE.Group(); const glass = box(1.15, 0.06, 1.7, panelMat); p.add(glass); const fr = box(1.22, 0.05, 1.77, std(0xc8ccd4, { m: 0.6, r: 0.4 })); fr.position.y = -0.03; p.add(fr); p.position.set(-2.6 + c * 1.3, 0.12, -0.95 + r * 1.85); panelRig.add(p); panels.push(p); }
for (const z of [-1.5, 0.4, 1.4]) { const rail = box(6.8, 0.06, 0.08, std(0x9aa3ad, { m: 0.7, r: 0.3 })); rail.position.set(0, 0.02, z); panelRig.add(rail); }
// garage + inverter + meter + battery + switch on the hero house's right side
const garage = box(3.6, 3, 5, std(0xf6e6b8)); garage.position.set(5, 1.5, 0.4); hero.add(garage);
const gdoor = box(2.6, 2.3, 0.06, std(0xe8e8e8)); gdoor.position.set(5, 1.15, 2.93); hero.add(gdoor);
const inv = new THREE.Group(); inv.position.set(3.32, 2.0, 3.07); hero.add(inv);
const invBox = box(0.9, 1.1, 0.28, std(0xdfe4ea, { r: 0.5 })); inv.add(invBox); const invLed = box(0.1, 0.1, 0.02, std(0x3ccf7a, { e: 0x3ccf7a, ei: 2 })); invLed.position.set(0.32, 0.42, 0.15); inv.add(invLed);
const invFace = makeCard(drawInverterFace, 0.85, 0.85, { anchor: 0, unit: 380, oy: 0.5 }); invFace.group.position.set(0, -0.02, 0.15); inv.add(invFace.group);
const meter = new THREE.Group(); meter.position.set(2.6, 1.6, 3.06); hero.add(meter);
meter.add(box(0.5, 0.7, 0.18, std(0xb8c0c8, { m: 0.4 }))); const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 32), std(0xf6f6f2)); dial.rotation.x = Math.PI / 2; dial.position.set(0, 0.08, 0.1); meter.add(dial);
const needle = box(0.02, 0.15, 0.02, std(0xff4d4d)); needle.position.set(0, 0.08, 0.14); meter.add(needle);
const battery = new THREE.Group(); battery.position.set(6.1, 0, 3.4); hero.add(battery);
battery.add((() => { const b = box(1.0, 1.9, 0.5, std(0xf8f8f8, { r: 0.4 })); b.position.y = 0.95; return b; })());
const batLevel = box(0.12, 1.2, 0.02, std(0x3ccf7a, { e: 0x3ccf7a, ei: 1.5 })); batLevel.position.set(0.3, 1.0, 0.26); battery.add(batLevel);
const sw = new THREE.Group(); sw.position.set(4.0, 1.4, 3.07); hero.add(sw); sw.add(box(0.5, 0.7, 0.2, std(0x5a6270, { m: 0.4 })));
const lever = new THREE.Group(); lever.position.set(0, 0, 0.12); sw.add(lever); const lv = box(0.08, 0.42, 0.08, std(0xff4d4d)); lv.position.y = 0.2; lever.add(lv);
const acUnit = new THREE.Group(); acUnit.position.set(-4.4, 0, 2.2); hero.add(acUnit);
acUnit.add((() => { const b = box(1.3, 1.1, 0.9, std(0xe8ecf0, { r: 0.5 })); b.position.y = 0.55; return b; })());
const acFan = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 6), std(0x4a5260)); acFan.rotation.x = Math.PI / 2; acFan.position.set(0, 0.6, 0.47); acUnit.add(acFan);
// poles + wires
const POLES = [-12.5, -4.2, 4.2, 12.5], PZ = 7.6, PH_ = 8;
POLES.forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, PH_, 12), std(0x8a6a4a)); p.position.set(x, PH_ / 2, PZ); p.castShadow = true; street.add(p); const arm = box(2.4, 0.16, 0.16, std(0x8a6a4a)); arm.position.set(x, PH_ - 0.5, PZ); street.add(arm); });
function cable(a, b, sag = 0.6, n = 24) { const pts = []; for (let i = 0; i <= n; i++) { const k = i / n; const v = new THREE.Vector3().lerpVectors(new THREE.Vector3(...a), new THREE.Vector3(...b), k); v.y -= Math.sin(k * Math.PI) * sag; pts.push(v); } const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 6), std(0x222222, { r: 0.6 })); m.castShadow = true; street.add(m); return pts.map(v => [v.x, v.y, v.z]); }
const lineY = PH_ - 0.4;
const mainLine = []; for (let i = 0; i < POLES.length - 1; i++) mainLine.push(...cable([POLES[i], lineY, PZ], [POLES[i + 1], lineY, PZ]));
const drop = cable([4.2, lineY, PZ], [1.5, 3.6, 3.05], 0.4);               // service drop to the hero house
const dropN1 = cable([-4.2, lineY, PZ], [-8.5 + 1.5, 3.6, 3.05], 0.4), dropN2 = cable([12.5, lineY, PZ], [8.5 + 1.5, 3.6, 3.05], 0.4);
// sun character in the sky
const sunCard = makeCard(drawSun, 5, 5, { anchor: 0.5, unit: 520, oy: 0.5, px: 512 }); street.add(sunCard.group);
// workers on the pole at x = 4.2
const workers = [0, 1].map(i => { const w = makeCard(drawWorker, 1.6, 2.6, { anchor: 0.5, unit: 350, oy: 0.95, px: 384, shadow: true }); street.add(w.group); return w; });
const platform = box(2.2, 0.12, 1.2, std(0xf2c230, { m: 0.3 })); platform.position.set(4.2, 5.2, PZ + 0.8); street.add(platform);
// flows
const fDC = makeFlow(street, [[0, 6.0, 1.6], [2.4, 5.2, 2.8], [3.3, 2.6, 3.25]], 60, 0xffd23f, 0.32);       // panels → inverter (DC)
const fToGrid = makeFlow(street, [[1.5, 3.6, 3.05], ...drop.slice().reverse(), ...mainLine.slice(mainLine.length / 3 * 1, mainLine.length / 3 * 2).reverse(), ...dropN1], 140, 0xffd23f, 0.3);
const fFromGrid = makeFlow(street, [...mainLine.slice(mainLine.length / 3, mainLine.length / 3 * 2 + 1), ...drop], 120, 0x3fa9ff, 0.3);
const fDanger = makeFlow(street, [[1.5, 3.6, 3.05], ...drop.slice().reverse()], 70, 0xff3030, 0.36);
const fBattery = makeFlow(street, [[6.1, 1.6, 3.7], [4.4, 1.6, 3.4], [3.3, 2.0, 3.25]], 40, 0x3ccf7a, 0.28);

// =================== ROOM ===================
const room = new THREE.Scene();
room.add(new THREE.HemisphereLight(0xffffff, 0x9a8a7a, 0.9));
const winLight = new THREE.DirectionalLight(0xfff0d0, 2.6); winLight.position.set(-6, 5, 4); winLight.castShadow = true; winLight.shadow.mapSize.set(1024, 1024); Object.assign(winLight.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); room.add(winLight);
const lamp = new THREE.PointLight(0xffd59a, 0, 14, 1.4); lamp.position.set(0.5, 3.4, 0.5); room.add(lamp);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), std(0xfff6dd, { e: 0xffd59a, ei: 0 })); bulb.position.copy(lamp.position); room.add(bulb);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), std(0xc89a6a, { r: 0.6, map: canvasTex(256, 256, (x) => { x.fillStyle = '#c89a6a'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#bd8f60' : '#d0a272'; x.fillRect(0, i * 32, 256, 30); } }) }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; room.add(floor);
const backWall = box(14, 5, 0.2, std(0xf2e6d2), false); backWall.position.set(0, 2.5, -3.5); room.add(backWall);
const sideWall = box(0.2, 5, 9, std(0xe8dcc8), false); sideWall.position.set(-4.5, 2.5, 0.5); room.add(sideWall);
const winSky = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, toneMapped: false })); winSky.position.set(-1.5, 2.6, -3.38); room.add(winSky);
const winFrame = box(2.6, 0.12, 0.1, std(0xffffff)); winFrame.position.set(-1.5, 1.66, -3.33); room.add(winFrame);
const outPanel = new THREE.Group(); outPanel.position.set(-1.5, 2.2, -3.36); room.add(outPanel);
const opg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), new THREE.MeshBasicMaterial({ map: CELLS, toneMapped: false })); outPanel.add(opg); outPanel.scale.setScalar(0.9);
const fridge = new THREE.Group(); fridge.position.set(2.6, 0, -2.7); room.add(fridge);
fridge.add((() => { const b = box(1.3, 2.8, 1.0, std(0xf4f6f8, { r: 0.3, m: 0.1 })); b.position.y = 1.4; return b; })());
const tv = new THREE.Group(); tv.position.set(0.6, 0, -3.1); room.add(tv); tv.add((() => { const b = box(1.6, 0.9, 0.08, std(0x1a1d24, { r: 0.2 })); b.position.y = 1.5; return b; })()); tv.add((() => { const b = box(1.4, 0.7, 0.5, std(0x8a6a4a)); b.position.y = 0.35; return b; })());
const washer = new THREE.Group(); washer.position.set(4.2, 0, -2.6); room.add(washer); washer.add((() => { const b = box(1.0, 1.1, 0.9, std(0xffffff, { r: 0.4 })); b.position.y = 0.55; return b; })());
const wdoor = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 10, 30), std(0x9aa3ad, { m: 0.6 })); wdoor.position.set(0, 0.5, 0.46); washer.add(wdoor);
const appFaces = [[fridge, 0, 1.9, 0.52, 0.9], [tv, 0, 1.5, 0.05, 0.75], [washer, 0, 0.55, 0.47, 0.5]].map(([g, x, y, z, s], i) => { const c = makeCard(drawApplianceFace, s, s, { anchor: 0, unit: 260, px: 256 }); c.group.position.set(x, y, z); g.add(c.group); return c; });
const fan = new THREE.Group(); fan.position.set(-2.4, 0, -0.6); room.add(fan);
fan.add((() => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 10), std(0x9aa3ad, { m: 0.6 })); b.position.y = 0.9; b.castShadow = true; return b; })()); fan.add((() => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 20), std(0x6a7280)); b.position.y = 0.04; return b; })());
const fanHead = new THREE.Group(); fanHead.position.set(0, 1.85, 0.12); fan.add(fanHead); fanHead.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), std(0x4f8cff)));
const blades = new THREE.Group(); blades.position.z = 0.12; fanHead.add(blades); for (let i = 0; i < 3; i++) { const b = box(0.18, 0.55, 0.02, std(0x9fd0ff, { op: 0.9 })); b.position.y = 0.3; const h = new THREE.Group(); h.rotation.z = i * Math.PI * 2 / 3; h.add(b); blades.add(h); }
const homeCard = makeCard(drawHomeowner, 2.1, 2.9, { anchor: 0.5, unit: 470, oy: 0.95, px: 512, contact: true, shadow: true }); room.add(homeCard.group);
const fWireDC = makeFlow(room, [[-1.5, 2.2, -3.3], [-1.9, 2.0, -3.2], [-2.4, 1.85, -0.5]], 30, 0xffd23f, 0.2);
const fWireAC = makeFlow(room, [[-4.38, 0.3, 4], [-4.38, 0.3, -3.3], [5.5, 0.3, -3.38]], 120, 0x3fa9ff, 0.22);

// =================== MACRO: exploded solar panel ===================
const macro = new THREE.Scene(); macro.background = new THREE.Color(0x0e1a33);
macro.add(new THREE.HemisphereLight(0xbfdcff, 0x1a2030, 1.4)); const mk = new THREE.DirectionalLight(0xfff0c0, 2.5); mk.position.set(-4, 8, 6); macro.add(mk);
const layers = [['glass', 0x9fd8ff, 0.5, 0.15], ['cells', 0x1c3a78, 1, 0.12], ['back', 0xf2f2f2, 1, 0.1], ['frame', 0x9aa3ad, 1, 0.08]].map(([n, c, op, th], i) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(4, th, 5.6), n === 'cells' ? new THREE.MeshStandardMaterial({ map: CELLS, roughness: 0.3, metalness: 0.3 }) : std(c, { op: op < 1 ? op : undefined, r: 0.2, m: n === 'frame' ? 0.6 : 0 }));
  macro.add(m); return m; });
const rays = [...Array(7)].map((_, i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, toneMapped: false })); macro.add(m); return m; });
const eFlow = makeFlow(macro, [[-1.6, 0.2, 2.4], [1.6, 0.2, 2.4], [2.4, 0.2, 2.4], [2.6, -0.4, 3.8], [2.6, -2, 6]], 80, 0xffd23f, 0.28);
const ePop = (() => { const n = 90, p = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const s = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff27a, size: 0.26, map: GLOW, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); s.frustumCulled = false; macro.add(s); return s; })();

// =================== composer / camera ===================
const composers = {};
function composerFor(scene, key) { if (composers[key]) return composers[key]; const c = new EffectComposer(renderer); c.setPixelRatio(1); c.setSize(PW, PH); c.addPass(new RenderPass(scene, camera)); const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.0015, maxblur: 0.006 }); c.addPass(bokeh); c.addPass(new OutputPass()); return (composers[key] = { c, bokeh }); }
function camKeys(t, keys) { let a = keys[0], b = keys[keys.length - 1]; for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i][0] && t <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; } if (t > keys[keys.length - 1][0]) a = b; const k = a === b ? 0 : E.inOutCubic(seg(t, a[0], b[0])); return [a[1].map((v, i) => lerp(v, b[1][i], k)), a[2].map((v, i) => lerp(v, b[2][i], k))]; }
function setCam(p, l) { camera.position.set(...p); camera.lookAt(...l); }

// =================== anchors ===================
let A = null;
function anchors() { if (A) return A; const w = (i, x, after) => T(i, x, after); const s = i => SEC(i).start;
  A = { s1: s(1), s2: s(2), s3: s(3), s4: s(4), s5: s(5), s6: s(6), s7: s(7), end: BEATS.duration,
    blazing: w(0, 'blazing,'), house: w(0, 'house'), why: w(0, 'Why?'),
    sandwich: w(1, 'sandwich'), sunlight: w(1, 'Sunlight'), electrons: w(1, 'electrons'), moving: w(1, 'moving'), just: w(1, 'Just'),
    w400: w(2, '400'), nice: w(2, 'Nice'), not: w(2, 'not'), wire: w(2, 'wire'), voltages: w(2, 'voltages'),
    dc: w(3, 'DC,'), home: w(3, 'home'), no: w(3, 'No,'), alt: w(3, 'Alternating'), inverter: w(3, 'inverter'), flips: w(3, 'flips'), f50: w(3, '50'),
    clocks: w(4, 'clocks'), so4: w(4, 'so'), extra: w(4, 'Extra'), meter: w(4, 'two-way'),
    workers: w(5, 'Workers'), if5: w(5, 'If'), hurt: w(5, 'hurt.'), so5: w(5, 'So'),
    battery: w(6, 'Add'), cuts: w(6, 'It'), runs: w(6, 'then'),
    polite: w(7, "It's", w(7, 'broken.')) };
  return A; }

// =================== frame state ===================
function streetState(t) {
  const a = anchors();
  const night = seg(t, a.clocks - 0.3, a.so4) * (1 - seg(t, a.extra - 0.3, a.extra));
  const blackout = t < a.s1 || (t > a.s5 && t < a.s7);
  const heroLit = (t > a.so4 && t < a.extra) || t > a.runs - 0.2;
  windows.forEach(w => { const on = w.hero ? (heroLit ? 1 : 0) : (t > a.so4 && t < a.extra ? 1 : 0); w.m.material.emissiveIntensity = on * 1.6; });
  hemi.intensity = lerp(1.3, 0.35, night); sunL.intensity = lerp(3.2, 0.25, night); sunL.color.setHex(night > 0.5 ? 0x6a8acc : 0xfff2d6);
  street.background = new THREE.Color().lerpColors(new THREE.Color(0x8fd0ff), new THREE.Color(0x0e1838), night);
  renderer.toneMappingExposure = lerp(1.25, 1.6, night);
  // panels: one at first, then the row appears
  panels.forEach((p, i) => { const k = t < a.wire ? (i === 2 ? 1 : 0) : E.outBack(seg(t, a.wire + i * 0.12, a.wire + 0.35 + i * 0.12), 1.6); p.scale.setScalar(Math.max(0.001, t < a.s2 ? 1 : k)); });
  // sun walking off
  const walk = seg(t, a.clocks - 0.2, a.so4 + 0.2);
  sunCard.group.position.set(lerp(5, 22, E.inCubic(walk)), 13.5 - walk * 2, -6); sunCard.update(t, { mood: t > a.clocks - 0.6 && t < a.so4 + 0.3 ? 'sleepy' : 'happy', walk: walk > 0 && walk < 1 }); sunCard.group.visible = !(night > 0.9);
  lever.rotation.x = t > a.cuts + 0.2 ? -1.2 : 0;
  battery.position.y = t < a.s6 ? -5 : lerp(4, 0, E.outBack(seg(t, a.battery, a.battery + 0.6), 1.3));
  batLevel.scale.y = 0.4 + 0.6 * seg(t, a.battery, a.runs);
  acUnit.scale.setScalar(E.outBack(seg(t, a.no - 0.1, a.no + 0.3), 1.8) * (1 - seg(t, a.alt - 0.2, a.alt)) + 0.0001);
  acFan.rotation.z = t * 8;
  workers.forEach((w, i) => { w.group.visible = t > a.s5 && t < a.s6; w.group.position.set(3.6 + i * 1.2, 5.26, PZ + 0.8); w.update(t, { mood: t > a.hurt - 0.4 && t < a.so5 ? 'shock' : 'calm', work: t < a.if5, ph: i }); });
  const invMood = t > a.so5 && t < a.s6 ? 'calm' : t > a.polite ? 'proud' : 'happy';
  invFace.update(t, { mood: invMood, shield: t > a.so5 && t < a.s6 ? E.outBack(seg(t, a.so5 + 0.2, a.so5 + 0.6), 1.6) : 0, bow: t > a.polite - 0.2 ? E.outBack(seg(t, a.polite - 0.2, a.polite + 0.2), 1.6) : 0 });
  inv.rotation.x = t > a.polite ? Math.sin(seg(t, a.polite, a.polite + 1.2) * Math.PI) * 0.35 : 0;
  invLed.material.color.setHex(t > a.so5 && t < a.s6 ? 0xff4d4d : 0x3ccf7a); invLed.material.emissive.setHex(t > a.so5 && t < a.s6 ? 0xff4d4d : 0x3ccf7a);
  needle.rotation.z = t > a.extra ? Math.sin(t * 3) * 1.2 : 0;
  // flows
  fDC.set(t, 'dc', (t > a.dc - 0.2 && t < a.home) || (t > a.inverter && t < a.s4) || (t > a.extra && t < a.s5) ? 1 : 0, 0.5);
  fToGrid.set(t, 'dc', t > a.extra && t < a.s5 ? 1 : 0, 0.18);
  fFromGrid.set(t, 'dc', t > a.so4 && t < a.extra ? 1 : 0, 0.18);
  fDanger.set(t, 'rev', t > a.if5 && t < a.so5 + 0.3 ? 1 - seg(t, a.so5, a.so5 + 0.3) : 0, 0.5);
  fBattery.set(t, 'dc', t > a.runs - 0.3 && t < a.s7 ? 1 : 0, 0.5);
}
function roomState(t) {
  const a = anchors();
  const lit = (t > a.w400 - 0.2 && t < a.s3) || t > a.s7; // the fan scene uses daylight + fan; lamp only when the house has power
  lamp.intensity = t > a.s7 ? 30 : 0; bulb.material.emissiveIntensity = t > a.s7 ? 2 : 0;
  blades.rotation.z = (t > a.w400 - 0.4 && t < a.s3) || t > a.s7 ? t * 14 : 0;
  outPanel.visible = t > a.s2 && t < a.s3;
  const dark = t < a.s1 || (t > a.s6 && t < a.battery);
  room.background = new THREE.Color(dark ? 0x2a2a34 : 0xf2e6d2);
  winLight.intensity = 2.6; room.children.forEach(c => { if (c.isHemisphereLight) c.intensity = dark ? 0.25 : 0.9; });
  const mood = t < a.s1 ? 'confused' : t > a.s7 ? 'happy' : t > a.s6 ? 'confused' : 'happy';
  homeCard.update(t, { mood, pose: t > a.s7 ? 'relax' : t > a.s6 ? 'shrug' : t > a.s2 ? 'point' : 'shrug', look: Math.sin(t * 2) });
  const aside = (t > a.home - 0.1 && t < a.no) || (t > a.alt - 0.1 && t < a.inverter); homeCard.group.visible = !aside; homeCard.group.position.set(t > a.s7 ? 0.6 : 0.4, 0, t > a.s7 ? 0.6 : 0.9);
  appFaces.forEach((c, i) => c.update(t, { mood: t > a.s7 ? 'happy' : 'unimpressed', ph: i }));
  fWireDC.set(t, 'dc', t > a.w400 - 0.2 && t < a.s3 ? 1 : 0, 0.7);
  fWireAC.set(t, 'ac', (t > a.home - 0.1 && t < a.no) || (t > a.alt - 0.1 && t < a.inverter) ? 1 : 0);
}
function macroState(t) {
  const a = anchors(), ex = E.inOutCubic(seg(t, a.sandwich - 0.1, a.sandwich + 0.8));
  layers.forEach((m, i) => { m.position.set(0, (1.5 - i) * lerp(0.18, 1.1, ex), 0); m.rotation.set(-0.15, 0.5, 0); });
  const rOn = seg(t, a.sunlight - 0.1, a.sunlight + 0.4);
  rays.forEach((r, i) => { const x = -1.6 + i * 0.55, z = -1.6 + (i % 3) * 1.2, k = ((t * 1.4 + i * 0.37) % 1); r.visible = rOn > 0; r.material.opacity = 0.8 * rOn; r.position.set(x - 2 + k * 0.4, 4.6, z - 1); r.rotation.set(0.35, 0, 0.45); r.scale.y = 1; });
  const p = ePop.geometry.attributes.position, cellsY = layers[1].position.y, popOn = t > a.electrons - 0.2 && t < a.moving + 0.6; ePop.visible = popOn;
  for (let i = 0; i < p.count; i++) { const k = ((t - a.electrons) * 0.9 + hash(i)) % 1; p.setXYZ(i, (hash(i + 1) - 0.5) * 3.6 + Math.sin(t * 3 + i) * 0.05, cellsY + 0.1 + k * 1.2, (hash(i + 2) - 0.5) * 5); }
  p.needsUpdate = true; eFlow.set(t, 'dc', t > a.moving - 0.1 ? 1 : 0, 0.45);
  eFlow.pts.position.y = cellsY - 0.2;
}

// =================== shots ===================
function shot(t) {
  const a = anchors(); let scene = 'street', p, l, focus = 18, ap = 0.0012;
  if (t < a.house - 0.05) { [p, l] = camKeys(t, [[0, [-16, 10, 30], [0, 3.2, 0]], [a.house, [0.3, 5.2, 17], [0, 3.6, 1]]]); }
  else if (t < a.s1) { scene = 'room'; [p, l] = camKeys(t, [[a.house, [1.6, 2.0, 6.5], [0.2, 1.6, -1]], [a.s1, [1.2, 1.8, 5.4], [0.2, 1.6, -1]]]); focus = 5.6; }
  else if (t < a.sandwich - 0.1) { [p, l] = camKeys(t, [[a.s1, [5, 9, 10], [0, 5.3, 1.8]], [a.sandwich - 0.1, [0.6, 6.4, 3.4], [0, 5.3, 1.6]]]); focus = 2.2; }
  else if (t < a.s2) { scene = 'macro'; [p, l] = camKeys(t, [[a.sandwich, [5, 3.5, 9], [0, 0.6, 0]], [a.moving, [4.5, 2.8, 8], [0.6, 0.3, 1]], [a.s2, [5.5, 3, 9.5], [0.8, 0.2, 1.5]]]); focus = 9; ap = 0.0006; }
  else if (t < a.wire - 0.05) { scene = 'room'; [p, l] = camKeys(t, [[a.s2, [0.2, 2.2, 5.5], [-1.8, 1.7, -1.5]], [a.not - 0.1, [0.2, 2.2, 5.5], [-1.8, 1.7, -1.5]], [a.not + 0.5, [1.8, 2.0, 4.6], [3.0, 1.4, -2.5]]]); focus = 6; }
  else if (t < a.home - 0.05) { [p, l] = camKeys(t, [[a.wire, [-5, 9.5, 11], [0, 5.4, 1.2]], [a.dc, [-4, 8.5, 11.5], [0.8, 4.6, 2]], [a.home, [-1.5, 5.5, 10.5], [2.6, 3.6, 2.8]]]); focus = 10.5; }
  else if (t < a.no - 0.05) { scene = 'room'; [p, l] = camKeys(t, [[a.home, [1.6, 1.4, 5.0], [-1.0, 0.4, -2]], [a.no, [2.2, 1.4, 5.2], [0, 0.4, -2.6]]]); focus = 5; }
  else if (t < a.alt - 0.05) { [p, l] = camKeys(t, [[a.no, [-1.8, 2.4, 8.5], [-4.4, 0.8, 2.4]], [a.alt, [-2.2, 2.2, 8], [-4.4, 0.8, 2.4]]]); focus = 6.3; }
  else if (t < a.inverter - 0.05) { scene = 'room'; [p, l] = camKeys(t, [[a.alt, [2.2, 1.4, 5.2], [0, 0.4, -2.6]], [a.inverter, [1.5, 1.2, 4.5], [-1.4, 0.4, -2.6]]]); focus = 5; }
  else if (t < a.s4) { [p, l] = camKeys(t, [[a.inverter, [5.5, 3.2, 9.5], [3.3, 2.2, 3.1]], [a.flips, [4.0, 2.4, 6.6], [3.3, 2.0, 3.1]], [a.s4, [3.8, 2.3, 6.3], [3.3, 2.0, 3.1]]]); focus = 2.5; }
  else if (t < a.so4 - 0.05) { [p, l] = camKeys(t, [[a.s4, [2, 4, 24], [8, 11, -6]], [a.so4, [4, 4.5, 26], [12, 10, -6]]]); focus = 30; }
  else if (t < a.extra - 0.05) { [p, l] = camKeys(t, [[a.so4, [12, 9, 24], [1, 4, 3]], [a.extra, [9, 8, 22], [1.5, 4, 3]]]); focus = 22; }
  else if (t < a.meter - 0.05) { [p, l] = camKeys(t, [[a.extra, [-2, 12, 28], [-2, 4, 3]], [a.meter, [0, 11, 26], [-1, 4, 3]]]); focus = 25; }
  else if (t < a.s5) { [p, l] = camKeys(t, [[a.meter, [3.4, 2.0, 5.2], [2.6, 1.6, 3.1]], [a.s5, [3.0, 1.8, 4.6], [2.6, 1.6, 3.1]]]); focus = 2.2; }
  else if (t < a.workers - 0.05) { [p, l] = camKeys(t, [[a.s5, [14, 8, 30], [0, 3, 2]], [a.workers, [10, 7, 25], [1, 3.5, 3]]]); focus = 24; }
  else if (t < a.so5 - 0.05) { [p, l] = camKeys(t, [[a.workers, [9, 6.5, 15], [4.2, 6.4, PZ]], [a.if5, [8, 6, 16], [3.4, 5.2, PZ - 1]], [a.so5, [9, 6.5, 17], [3, 4.6, 5]]]); focus = 9; }
  else if (t < a.s6) { [p, l] = camKeys(t, [[a.so5, [3.8, 2.3, 6.4], [3.3, 2.0, 3.1]], [a.s6, [3.7, 2.2, 6.1], [3.3, 2.0, 3.1]]]); focus = 3.2; }
  else if (t < a.battery - 0.05) { scene = 'room'; p = [1.2, 1.8, 5.4]; l = [0.2, 1.6, -1]; focus = 5; }
  else if (t < a.runs - 0.05) { [p, l] = camKeys(t, [[a.battery, [8.5, 2.8, 9.5], [5.6, 1.2, 3.3]], [a.cuts, [6.4, 2.3, 7.6], [4.6, 1.4, 3.1]], [a.runs, [5.6, 2.0, 6.4], [4.0, 1.4, 3.1]]]); focus = 4; }
  else if (t < a.s7) { [p, l] = camKeys(t, [[a.runs, [10, 6, 22], [0, 3, 2]], [a.s7, [12, 8, 26], [0, 3, 2]]]); focus = 22; }
  else if (t < a.polite - 0.05) { scene = 'room'; [p, l] = camKeys(t, [[a.s7, [1.4, 2.0, 6.0], [0.4, 1.4, -1]], [a.polite, [1.0, 1.8, 5.0], [0.4, 1.3, -1]]]); focus = 4.6; }
  else { [p, l] = camKeys(t, [[a.polite, [3.7, 2.2, 6.2], [3.3, 2.0, 3.1]], [a.end, [3.6, 2.1, 5.8], [3.3, 2.0, 3.1]]]); focus = 2.9; }
  return { scene, p, l, focus, ap };
}

// =================== frame ===================
function drawFrame(t) {
  const a = anchors(), s = shot(t);
  const sc = s.scene === 'room' ? room : s.scene === 'macro' ? macro : street;
  if (s.scene === 'street') streetState(t); else if (s.scene === 'room') roomState(t); else macroState(t);
  if (s.scene !== 'street') renderer.toneMappingExposure = 1.25;
  setCam(s.p, s.l);
  if (s.scene === 'street') { sunCard.face(camera); workers.forEach(w => w.face(camera)); }
  if (s.scene === 'room') homeCard.face(camera);
  const { c, bokeh } = composerFor(sc, s.scene); bokeh.uniforms.focus.value = s.focus; bokeh.uniforms.aperture.value = s.ap; c.render();
  const ctx = CTX; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(renderer.domElement, 0, 0, CANVAS.width, CANVAS.height); ctx.setTransform(SC, 0, 0, SC, 0, 0);
  // overlays
  if (t < a.s1) qmark(ctx, t, a.why - 0.05);
  if (t > a.just && t < a.s2) { tag(ctx, 'LIGHT IN ↓', 540, 620, E.outBack(seg(t, a.just, a.just + 0.3), 1.6), '#1b1f3b', '#ffd23f'); tag(ctx, 'POWER OUT →', 620, 1150, E.outBack(seg(t, a.just + 0.5, a.just + 0.8), 1.6), '#1b1f3b', '#ffd23f'); }
  if (t > a.w400 - 0.1 && t < a.wire) tag(ctx, '≈ 400 W', 360, 700, E.outBack(seg(t, a.w400 - 0.1, a.w400 + 0.25), 1.6), '#ffd23f', '#1b1f3b', 80);
  if (t > a.wire && t < a.s3) { const n = Math.min(10, Math.floor(seg(t, a.wire, a.voltages + 1.2) * 10) + 1); if (t > a.voltages - 0.2) batteryStack(ctx, t, Math.min(8, Math.floor(seg(t, a.voltages - 0.2, a.s3 - 0.3) * 8) + 1), 860, 1150); tag(ctx, '+ → − → + → −', 400, 700, E.outBack(seg(t, a.wire + 0.6, a.wire + 0.9), 1.6), '#1b1f3b', '#fff', 50); }
  if (t > a.dc - 0.1 && t < a.home) tag(ctx, 'DC → ONE WAY', 540, 760, E.outBack(seg(t, a.dc - 0.1, a.dc + 0.25), 1.6), '#ffd23f', '#1b1f3b', 70);
  if (t > a.home && t < a.no) tag(ctx, 'AC ∿', 540, 760, E.outBack(seg(t, a.home, a.home + 0.25), 1.6), '#3fa9ff', '#fff', 80);
  if (t > a.no && t < a.alt) stampMk(ctx, 'NOT THIS AC', 540, 760, E.outBack(seg(t, a.no + 0.5, a.no + 0.75), 2));
  if (t > a.alt && t < a.inverter) tag(ctx, 'ALTERNATING CURRENT ∿', 540, 760, E.outBack(seg(t, a.alt, a.alt + 0.25), 1.6), '#3fa9ff', '#fff', 58);
  if (t > a.flips && t < a.s4) { const ph = Math.sin(t * Math.PI * 2 * 2) > 0; tag(ctx, ph ? '→→→' : '←←←', 540, 720, 1, ph ? '#ffd23f' : '#3fa9ff', '#1b1f3b', 80, 0); }
  if (t > a.f50 - 0.1 && t < a.s4) tag(ctx, '50–60× A SECOND', 540, 880, E.outBack(seg(t, a.f50 - 0.1, a.f50 + 0.25), 1.6), '#1b1f3b', '#ffd23f', 64);
  if (t > a.meter - 0.05 && t < a.s5) scoreboard(ctx, t, 540, 760, E.outBack(seg(t, a.meter, a.meter + 0.3), 1.6), Math.round(lerp(120, 132, seg(t, a.meter, a.s5))), Math.round(lerp(88, 141, seg(t, a.meter, a.s5))));
  if (t > a.s5 && t < a.workers) tag(ctx, 'BLACKOUT', 540, 760, E.outBack(seg(t, a.s5 + 0.1, a.s5 + 0.4), 1.6), '#1b1f3b', '#ff4d4d', 90);
  if (t > a.if5 + 0.3 && t < a.so5) dangerSign(ctx, t, 790, 760, E.outBack(seg(t, a.if5 + 0.3, a.if5 + 0.6), 1.8));
  if (t > a.cuts && t < a.runs) tag(ctx, 'DISCONNECTED FROM GRID', 540, 760, E.outBack(seg(t, a.cuts + 0.2, a.cuts + 0.5), 1.6), '#3ccf7a', '#fff', 54);
  // cut dips
  for (const ct of [a.house, a.s1, a.sandwich, a.s2, a.wire, a.home, a.no, a.alt, a.inverter, a.s4, a.so4, a.extra, a.meter, a.s5, a.workers, a.so5, a.s6, a.battery, a.runs, a.s7, a.polite]) { const d = 1 - Math.abs(t - ct) / 0.1; if (d > 0) { ctx.fillStyle = `rgba(10,12,24,${0.8 * d})`; ctx.fillRect(0, 0, W, H); } }
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,20,0.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  captions(ctx, t, 1430, { size: 100 });
  subscribeBtn(ctx, t, a.end - 2.0);
  ctx.fillStyle = `rgba(0,0,0,${seg(t, a.end - 0.25, a.end - 0.02)})`; ctx.fillRect(0, 0, W, H);
}
function buildCues() {
  const a = anchors(), q = [], add = (t, type, gain = 1, extra = {}) => q.push({ t: +t.toFixed(3), type, gain, ...extra });
  add(0, 'birds', 0.15, { dur: a.house });
  add(a.house - 0.1, 'powerdown', 0.5); add(a.why - 0.05, 'boing', 0.5);
  add(a.sandwich, 'swoosh', 0.4); add(a.sunlight, 'shimmer', 0.5); add(a.electrons, 'zips', 0.5, { dur: 1.6 }); add(a.moving, 'hum', 0.3, { dur: a.s2 - a.moving });
  add(a.w400 - 0.1, 'pop', 0.5); add(a.w400, 'fan', 0.35, { dur: a.wire - a.w400 }); add(a.not, 'tick', 0.4);
  for (let i = 0; i < 10; i++) add(a.wire + i * 0.12, 'clink', 0.35); for (let i = 0; i < 8; i++) add(a.voltages - 0.2 + i * (a.s3 - a.voltages - 0.1) / 8, 'pop', 0.3);
  add(a.dc - 0.1, 'zips', 0.4, { dur: 1.4 }); add(a.home, 'wobble', 0.4, { dur: 1.5 }); add(a.no + 0.5, 'stamp', 0.8); add(a.alt, 'wobble', 0.35, { dur: 1.4 }); add(a.flips, 'flipflop', 0.45, { dur: a.s4 - a.flips });
  add(a.clocks - 0.4, 'yawn', 0.5); add(a.clocks, 'steps', 0.3, { dur: 1.2 }); add(a.so4, 'crickets', 0.35, { dur: a.extra - a.so4 }); add(a.extra, 'chime', 0.45); add(a.meter, 'tick', 0.4); add(a.meter + 0.3, 'counter', 0.4, { dur: 2 });
  add(a.s5 - 0.1, 'powerdown', 0.7); add(a.workers, 'wrench', 0.35, { dur: a.if5 - a.workers }); add(a.if5 + 0.3, 'alarm', 0.35, { dur: a.so5 - a.if5 - 0.3 }); add(a.hurt - 0.3, 'zap', 0.6);
  add(a.so5 + 0.2, 'shield', 0.6); add(a.battery, 'thud', 0.5); add(a.cuts + 0.2, 'clunk', 0.7); add(a.runs - 0.2, 'powerup', 0.6);
  add(a.s7, 'chime', 0.4); add(a.polite, 'ding', 0.5); add(a.end - 2.0, 'pop', 0.6); add(a.end - 1.1, 'click', 0.7); add(a.end - 1.05, 'bell', 0.7);
  return q.sort((x, y) => x.t - y.t);
}
window.drawFrame = drawFrame;
(async () => { await document.fonts.ready; window.CUES = buildCues(); drawFrame(0.01); drawFrame(30); drawFrame(12); window.READY = true; })();
