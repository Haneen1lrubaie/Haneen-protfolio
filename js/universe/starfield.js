import * as THREE from "three";

/**
 * A soft, round, alpha-mapped point sprite (fixes the classic "stars
 * look like squares" Three.js Points issue) used by every star layer
 * and by planet/sun glow sprites elsewhere in the universe.
 */
export function makeRadialTexture(color) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

let sharedStarSprite = null;
function getStarSprite() {
  if (!sharedStarSprite) sharedStarSprite = makeRadialTexture("rgba(255,255,255,1)");
  return sharedStarSprite;
}

// Realistic star "temperature" palette: cool blue-white, neutral white,
// warm yellow, and rare orange/red — weighted toward white like a real sky.
const STAR_COLORS = [
  { c: new THREE.Color(0xbfd4ff), w: 0.22 }, // blue-white
  { c: new THREE.Color(0xffffff), w: 0.5 },  // white
  { c: new THREE.Color(0xfff2c4), w: 0.2 },  // warm yellow
  { c: new THREE.Color(0xffcf9e), w: 0.08 }, // orange
];
function pickStarColor() {
  let r = Math.random();
  for (const s of STAR_COLORS) { if (r < s.w) return s.c; r -= s.w; }
  return STAR_COLORS[1].c;
}

/**
 * Builds one non-uniform star layer: per-star color + varied opacity
 * baked into vertex colors, real point sprites (round, not squares),
 * and a mild size falloff by simulated distance so it doesn't read as
 * a perfectly even grid of dots.
 */
function buildStarLayer(count, radiusRange, baseSize) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = radiusRange[0] + Math.random() * (radiusRange[1] - radiusRange[0]);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const col = pickStarColor();
    const brightness = 0.5 + Math.random() * 0.5;
    colors[i * 3] = col.r * brightness;
    colors[i * 3 + 1] = col.g * brightness;
    colors[i * 3 + 2] = col.b * brightness;

    // occasional standout bright star
    sizes[i] = Math.random() > 0.985 ? baseSize * (2.2 + Math.random() * 1.8) : baseSize * (0.5 + Math.random() * 0.9);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  // Note: PointsMaterial only exposes one uniform `size`; per-star size
  // variation would need a custom ShaderMaterial. We approximate visual
  // variety instead via per-layer size + opacity + the "standout" sizes
  // array folded into a slightly larger shared size below.
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;

  const mat = new THREE.PointsMaterial({
    size: avgSize,
    map: getStarSprite(),
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    alphaTest: 0.02,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

/**
 * Creates depth-layered stars (far / mid / near) with real parallax:
 * layers closer to the camera are offset by a larger fraction of the
 * camera's own position, so as the camera travels, near stars visibly
 * shift more than far ones — call update(delta, reduced, camera).
 */
export function createStarfield(scene, { density = 1 } = {}) {
  const layerConfigs = [
    { count: Math.floor(2200 * density), radius: [700, 950], size: 1.0, parallax: 0.02, spin: 0.0004 },
    { count: Math.floor(1100 * density), radius: [420, 650], size: 1.5, parallax: 0.05, spin: 0.0009 },
    { count: Math.floor(380 * density), radius: [220, 380], size: 2.1, parallax: 0.1, spin: 0.0016 },
  ];

  const layers = layerConfigs.map(cfg => ({
    points: buildStarLayer(cfg.count, cfg.radius, cfg.size),
    parallax: cfg.parallax,
    spin: cfg.spin,
    basePosition: new THREE.Vector3(0, 0, 0),
  }));
  layers.forEach(l => scene.add(l.points));

  // Subtle, sparse nebula haze (kept faint per "elegant deep-space realism")
  const nebulaTexture = makeRadialTexture("rgba(90,120,255,0.14)");
  const nebulaColors = [0x3a5cff, 0x6a3aff, 0x2ad6ff];
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.SpriteMaterial({
      map: nebulaTexture, color: nebulaColors[i % nebulaColors.length],
      transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(mat);
    const dist = 420 + Math.random() * 260;
    const theta = Math.random() * Math.PI * 2;
    sprite.position.set(Math.cos(theta) * dist, (Math.random() - 0.5) * 200, Math.sin(theta) * dist);
    const scale = 300 + Math.random() * 300;
    sprite.scale.set(scale, scale, 1);
    scene.add(sprite);
  }

  function update(delta, reduced, camera) {
    if (reduced) return;
    layers.forEach(l => {
      l.points.rotation.y += l.spin * delta * 60;
      if (camera) {
        l.points.position.set(camera.position.x * l.parallax, camera.position.y * l.parallax, camera.position.z * l.parallax);
      }
    });
  }

  return { update };
}
