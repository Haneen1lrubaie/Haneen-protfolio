import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createStarfield } from "./starfield.js";
import { createSun } from "./sun.js";
import { createPlanet } from "./planet.js";
import { maybeSpawnShootingStar, updateShootingStars } from "./shootingStar.js";

const canvas = document.getElementById("universe-canvas");
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
const isSmallScreen = window.innerWidth < 820;
const isMobile = isCoarsePointer || isSmallScreen;
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03050a, 0.0014);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 2000);

/* Responsive framing: on narrow/tall viewports (phones in portrait, small
   tablets) pull the camera back further so all orbits stay on-screen
   instead of clipping — recalculated on every resize/orientation change. */
function computeOverviewRadius() {
  const aspect = window.innerWidth / window.innerHeight;
  const base = 62;
  if (aspect >= 1) return base;
  return base / Math.max(aspect, 0.45);
}
function computeViewDistanceScale() {
  const aspect = window.innerWidth / window.innerHeight;
  return aspect >= 1 ? 1 : Math.min(1.5, 1 / Math.max(aspect, 0.6));
}
let overviewRadius = computeOverviewRadius();
let viewDistanceScale = computeViewDistanceScale();
const OVERVIEW_POS = new THREE.Vector3(0, overviewRadius * 0.42, overviewRadius);
camera.position.copy(OVERVIEW_POS);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x03050a, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Low-ish ambient plus a soft camera-attached fill light: keeps a real
// day/night feel from the Sun, but ensures whatever the camera is
// looking at during a close flyby still reads bright and crisp (the
// single-point-light-only setup left planets looking dim/flat from
// some angles — this fixes that without going fully "evenly lit").
scene.add(new THREE.AmbientLight(0x2a3560, 0.32));
const cameraFill = new THREE.PointLight(0xeef4ff, 1.6, 0, 1.4);
camera.add(cameraFill);
scene.add(camera);

/* ---------- Cinematic post-processing (skipped on mobile for perf) ---------- */
let composer = null;
if (!isMobile) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55,  // strength — softer, less blown-out sun/glow
    0.5,   // radius
    0.8    // threshold — only the very brightest pixels bloom
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

const starfield = createStarfield(scene, { density: isMobile ? 0.45 : 1 });
const sun = createSun(scene);

/* ---------- Real texture loading (see ASSETS.md for full provenance) ----------
   Verified, legitimately-licensed real photographic textures — Earth from
   three.js's own official repository (NASA-derived, MIT repo); Mars,
   Jupiter, Saturn (+ring) and Uranus (+ring) from jeromeetienne's
   threex.planets project (MIT-licensed, sourced from planetpixelemporium,
   used across the three.js community for over a decade). All downloaded
   and stored locally in assets/textures/planets/ — nothing hotlinked. */
const manager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(manager);
const TEX_BASE = "assets/textures/planets/";

function loadColorTexture(path) {
  const tex = textureLoader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function loadDataTexture(path) {
  // normal/bump/roughness/alpha maps are NOT color-managed (sRGB would
  // wrongly gamma-correct the data), so these load without colorSpace.
  return textureLoader.load(path);
}

const earthTextures = { diffuse: null, normal: null, specular: null, emissive: null, clouds: null };
earthTextures.diffuse = loadColorTexture(TEX_BASE + "earth/earth_atmos_2048.jpg");
earthTextures.emissive = loadColorTexture(TEX_BASE + "earth/earth_lights_2048.png");
earthTextures.clouds = loadColorTexture(TEX_BASE + "earth/earth_clouds_1024.png");

const marsTextures = { diffuse: null, bump: null };
marsTextures.diffuse = loadColorTexture(TEX_BASE + "mars/mars_color.jpg");

const jupiterTextures = { diffuse: null };
jupiterTextures.diffuse = loadColorTexture(TEX_BASE + "jupiter/jupiter_color.jpg");

const saturnTextures = { diffuse: null, ringMap: null, ringAlpha: null };
saturnTextures.diffuse = loadColorTexture(TEX_BASE + "saturn/saturn_color.jpg");
saturnTextures.ringMap = loadColorTexture(TEX_BASE + "saturn/saturn_ring_color.jpg");

const uranusTextures = { diffuse: null, ringMap: null, ringAlpha: null };
uranusTextures.diffuse = loadColorTexture(TEX_BASE + "uranus/uranus_color.jpg");
uranusTextures.ringMap = loadColorTexture(TEX_BASE + "uranus/uranus_ring_color.jpg");

if (!isMobile) {
  // Skip the heavier detail maps on mobile to cut payload/GPU cost —
  // the diffuse map alone still reads correctly as "that planet".
  earthTextures.normal = loadDataTexture(TEX_BASE + "earth/earth_normal_2048.jpg");
  earthTextures.specular = loadDataTexture(TEX_BASE + "earth/earth_specular_2048.jpg");
  marsTextures.bump = loadDataTexture(TEX_BASE + "mars/mars_bump.jpg");
  saturnTextures.ringAlpha = loadDataTexture(TEX_BASE + "saturn/saturn_ring_pattern.gif");
  uranusTextures.ringAlpha = loadDataTexture(TEX_BASE + "uranus/uranus_ring_trans.gif");
}

manager.onProgress = (url, loaded, total) => {
  window.dispatchEvent(new CustomEvent("universe:loading-progress", { detail: { percent: Math.round((loaded / total) * 100) } }));
};
manager.onLoad = () => {
  window.dispatchEvent(new CustomEvent("universe:loading-complete"));
};
manager.onError = () => {
  // Non-fatal — a planet whose texture failed to load just renders as an
  // untextured MeshStandardMaterial (still shaded/lit correctly); the
  // rest of the universe is unaffected either way.
  window.dispatchEvent(new CustomEvent("universe:loading-complete"));
};

/* ---------- Planet configuration — one per portfolio section ----------
   Each is styled after a recognizable real-planet "family" so it reads
   as a genuine celestial body rather than a colored ball, while still
   mapping 1:1 to a portfolio section (no navigation/content changes). */
const SECTION_ORDER = ["about", "projects", "skills", "contact"];
const planetDefs = [
  // About — REAL Earth photography (see ASSETS.md)
  {
    id: "about", label: "About", type: "ocean", color: 0x1f5fa8, landColor: 0x3f7d3f,
    size: 3.3, orbitRadius: 16, orbitSpeed: 0.09, startAngle: 0.3, spinSpeed: 0.12,
    cloudCoverage: 0.5, atmosphereColor: 0x6fb8ff, atmosphereIntensity: 1.1,
    realTextures: earthTextures, isMobile,
  },
  // Projects — REAL Saturn photography + real photographic ring (see ASSETS.md)
  {
    id: "projects", label: "Projects", type: "gasBanded", color: 0xd9c48a,
    size: 4.6, orbitRadius: 26, orbitSpeed: 0.05, startAngle: 2.1, spinSpeed: 0.22,
    hasRing: true, ringColor: 0xcbb98f, atmosphereColor: 0xf0e0b0, atmosphereIntensity: 0.6,
    realTextures: saturnTextures, isMobile,
  },
  // Skills — REAL Jupiter photography (see ASSETS.md); tech "moons" kept procedural
  {
    id: "skills", label: "Skills", type: "gasStorm", color: 0xc9a37a,
    size: 3.9, orbitRadius: 36, orbitSpeed: 0.038, startAngle: 4.0, spinSpeed: 0.3,
    satelliteCount: 4, atmosphereColor: 0xe8c9a0, atmosphereIntensity: 0.5,
    realTextures: jupiterTextures, isMobile,
  },
  // Experience — REAL Uranus photography + real ring (see ASSETS.md)
  {
    id: "experience", label: "Experience", type: "iceGiant", color: 0x8fd6d9,
    size: 3.1, orbitRadius: 46, orbitSpeed: 0.028, startAngle: 5.4, spinSpeed: 0.1,
    hasRing: true, ringColor: 0xbfe6e6, atmosphereColor: 0xaef0f2, atmosphereIntensity: 0.7,
    realTextures: uranusTextures, isMobile,
  },
  // Contact — REAL Mars photography + real bump map (see ASSETS.md)
  {
    id: "contact", label: "Contact", type: "rocky", color: 0xb2532f,
    size: 2.5, orbitRadius: 56, orbitSpeed: 0.02, startAngle: 1.2, spinSpeed: 0.14,
    atmosphereColor: 0xd98a5f, atmosphereIntensity: 0.3,
    realTextures: marsTextures, isMobile,
  },
];

const planets = planetDefs.map(def => createPlanet(scene, def));
const planetById = Object.fromEntries(planets.map(p => [p.id, p]));

/* ---------- State ---------- */
let state = "overview"; // overview | traveling | at:<id>
let currentTarget = null;
let overviewAngle = 0;
const lookTarget = new THREE.Vector3(0, 0, 0);
const tmpVec = new THREE.Vector3();
const clock = new THREE.Clock();

/* ---------- Camera travel (GSAP-driven) ---------- */
function flyTo(id) {
  const planet = planetById[id];
  if (!planet || state === "traveling") return;

  const planetPos = planet.getWorldPosition(tmpVec.clone());
  const dirFromCenter = planetPos.clone().normalize();
  const viewDistance = (planet.mesh.geometry.parameters.radius * 8.5 + 6) * viewDistanceScale;
  const destination = planetPos.clone()
    .add(dirFromCenter.clone().multiplyScalar(viewDistance))
    .add(new THREE.Vector3(0, viewDistance * 0.32, 0));

  state = "traveling";
  window.dispatchEvent(new CustomEvent("universe:traveling", { detail: { id } }));

  const duration = reducedMotion ? 0.4 : 1.9;
  const camPos = camera.position;
  const look = lookTarget;

  const tl = gsap.timeline({
    onComplete: () => {
      state = "at:" + id;
      currentTarget = id;
      window.dispatchEvent(new CustomEvent("universe:arrived", { detail: { id } }));
    },
  });

  tl.to(camPos, {
    x: destination.x, y: destination.y, z: destination.z,
    duration, ease: reducedMotion ? "power1.out" : "power2.inOut",
  }, 0);
  tl.to(look, {
    x: planetPos.x, y: planetPos.y, z: planetPos.z,
    duration, ease: reducedMotion ? "power1.out" : "power2.inOut",
    onUpdate: () => camera.lookAt(look),
  }, 0);

  if (!reducedMotion) {
    tl.to(camera, { fov: 58, duration: duration * 0.35, ease: "sine.out", onUpdate: () => camera.updateProjectionMatrix() }, 0);
    tl.to(camera, { fov: 52, duration: duration * 0.65, ease: "sine.inOut", onUpdate: () => camera.updateProjectionMatrix() }, duration * 0.35);
  }
}

function resetToOverview() {
  if (state === "traveling") return;
  state = "traveling";
  currentTarget = null;
  const duration = reducedMotion ? 0.4 : 1.7;
  const tl = gsap.timeline({
    onComplete: () => {
      state = "overview";
      window.dispatchEvent(new CustomEvent("universe:left"));
    },
  });
  tl.to(camera.position, { x: OVERVIEW_POS.x, y: OVERVIEW_POS.y, z: OVERVIEW_POS.z, duration, ease: "power2.inOut" }, 0);
  tl.to(lookTarget, {
    x: 0, y: 0, z: 0, duration, ease: "power2.inOut",
    onUpdate: () => camera.lookAt(lookTarget),
  }, 0);
}

/* ---------- Click-to-select a planet directly in 3D ---------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
canvas.addEventListener("click", (e) => {
  if (state !== "overview") return;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const meshes = planets.map(p => p.mesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length) {
    window.dispatchEvent(new CustomEvent("universe:select", { detail: { id: hits[0].object.userData.sectionId } }));
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isMobile) return;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(planets.map(p => p.mesh), false);
  canvas.style.cursor = hits.length && state === "overview" ? "pointer" : "default";
  window.dispatchEvent(new CustomEvent("universe:hover", { detail: { id: hits.length ? hits[0].object.userData.sectionId : null } }));
});

/* ---------- Resize / orientation change ---------- */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  overviewRadius = computeOverviewRadius();
  viewDistanceScale = computeViewDistanceScale();
  OVERVIEW_POS.set(0, overviewRadius * 0.42, overviewRadius);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener("orientationchange", () => {
  // Some mobile browsers report stale innerWidth/Height immediately on
  // the orientationchange event — re-measure one tick later.
  setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
});

/* ---------- Visibility: pause render loop when tab hidden (perf) ---------- */
let isVisible = true;
document.addEventListener("visibilitychange", () => { isVisible = document.visibilityState === "visible"; });

/* ---------- Animation loop ---------- */
function animate() {
  requestAnimationFrame(animate);
  if (!isVisible) return;
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  starfield.update(delta, reducedMotion, camera);
  sun.update(delta, elapsed);
  planets.forEach(p => p.update(delta, reducedMotion));

  if (!reducedMotion && !isMobile) {
    maybeSpawnShootingStar(scene, elapsed, 0.025);
  }
  updateShootingStars(scene, elapsed, delta);

  if (state === "overview" && !reducedMotion) {
    overviewAngle += delta * 0.02;
    camera.position.x = Math.sin(overviewAngle) * overviewRadius;
    camera.position.z = Math.cos(overviewAngle) * overviewRadius;
    camera.position.y = OVERVIEW_POS.y + Math.sin(overviewAngle * 0.5) * 2;
    camera.lookAt(0, 0, 0);
  }

  if (state.startsWith("at:") && currentTarget && !reducedMotion) {
    const p = planetById[currentTarget];
    if (p) {
      p.getWorldPosition(tmpVec);
      camera.lookAt(tmpVec);
    }
  }

  if (composer) composer.render();
  else renderer.render(scene, camera);
}
animate();

/* ---------- Public API ---------- */
window.Universe = {
  ready: true,
  sectionOrder: SECTION_ORDER,
  planetColors: Object.fromEntries(planetDefs.map(d => [d.id, "#" + d.color.toString(16).padStart(6, "0")])),
  isMobile,
  flyTo,
  resetToOverview,
  setReducedMotion(v) { reducedMotion = v; },
};
window.dispatchEvent(new CustomEvent("universe:ready"));
