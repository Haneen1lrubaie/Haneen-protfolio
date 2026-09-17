import * as THREE from "three";
import { makeRadialTexture } from "./starfield.js";
import { makeSurfaceTexture, makeCloudTexture, makeCityLightsTexture, makeRingTexture } from "./textures.js";
import { createAtmosphere } from "./atmosphere.js";

/** Remaps a RingGeometry's UVs so a horizontal-strip texture (see
 * makeRingTexture) reads radially from inner to outer edge, instead of
 * the default UVs which aren't useful for this. Standard three.js trick. */
function remapRingUVs(geometry, innerRadius, outerRadius) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const radius = v3.length();
    const u = (radius - innerRadius) / (outerRadius - innerRadius);
    uv.setXY(i, u, 1);
  }
  uv.needsUpdate = true;
}

/**
 * Creates one planet: an orbit pivot (rotates around the sun), the
 * planet mesh (spins on its own axis, own speed) with a realistic
 * procedural surface, optional cloud layer, Fresnel atmosphere, a
 * faint orbit path line, and optional decorations (real Saturn-style
 * ring / satellites) that give each destination a distinct, immediately
 * recognizable visual identity.
 *
 * opts.type: "ocean" (Earth-like) | "gasStorm" (Jupiter-like) |
 *            "gasBanded" (Saturn-like) | "iceGiant" (Uranus/Neptune-like) |
 *            "rocky" (Mars-like)
 */
export function createPlanet(scene, opts) {
  const {
    id, label, color, size, orbitRadius, orbitSpeed, startAngle = 0,
    hasRing = false, satelliteCount = 0, textureVariant = 0,
    type = "rocky", spinSpeed = 0.08, atmosphereColor = null, atmosphereIntensity = 1,
    landColor = 0x4a7c4a, cloudCoverage = 0, cityLights = false, ringColor = null,
    realTextures = null, // { diffuse, normal, specular, bump, emissive, clouds, ringMap } THREE.Texture instances, pre-loaded
    isMobile = false,
  } = opts;

  const pivot = new THREE.Object3D();
  pivot.rotation.y = startAngle;
  scene.add(pivot);

  // Faint orbit path
  const orbitPoints = [];
  const segments = 160;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
  }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x3a5478, transparent: true, opacity: 0.3 });
  const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
  scene.add(orbitLine);

  // --- Surface: real NASA-derived textures where provided (see main.js /
  //     ASSETS.md — currently only the Earth-styled "About" planet has
  //     verified real imagery); every other planet uses the procedural
  //     generator in textures.js. ---
  const geo = new THREE.SphereGeometry(size, 96, 96);
  let mat;
  if (realTextures && realTextures.diffuse) {
    const materialProps = { map: realTextures.diffuse, roughness: 0.7, metalness: 0.08 };
    if (!isMobile && realTextures.normal) { materialProps.normalMap = realTextures.normal; materialProps.normalScale = new THREE.Vector2(0.7, 0.7); }
    if (!isMobile && realTextures.specular) { materialProps.roughnessMap = realTextures.specular; }
    if (!isMobile && realTextures.bump && !realTextures.normal) { materialProps.bumpMap = realTextures.bump; materialProps.bumpScale = 0.05; }
    if (realTextures.emissive) {
      materialProps.emissiveMap = realTextures.emissive;
      materialProps.emissive = new THREE.Color(0xfff0c8);
      materialProps.emissiveIntensity = 1.2;
    }
    mat = new THREE.MeshStandardMaterial(materialProps);
  } else {
    const surfaceTexture = makeSurfaceTexture(type, color, { landColor });
    const materialProps = {
      map: surfaceTexture,
      roughness: type === "gasStorm" || type === "gasBanded" || type === "iceGiant" ? 0.9 : 0.85,
      metalness: 0.03,
    };
    if (cityLights) {
      materialProps.emissiveMap = makeCityLightsTexture(landColor);
      materialProps.emissive = new THREE.Color(0xfff0c8);
      materialProps.emissiveIntensity = 1.4;
    }
    mat = new THREE.MeshStandardMaterial(materialProps);
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(orbitRadius, 0, 0);
  mesh.rotation.z = (Math.random() - 0.5) * 0.45;
  mesh.userData.sectionId = id;
  pivot.add(mesh);

  // --- Cloud shell: real cloud photo if provided, else procedural ---
  let clouds = null;
  if (realTextures && realTextures.clouds) {
    const cloudMat = new THREE.MeshStandardMaterial({
      map: realTextures.clouds, transparent: true, opacity: 0.85, depthWrite: false, roughness: 1,
    });
    clouds = new THREE.Mesh(new THREE.SphereGeometry(size * 1.012, 64, 64), cloudMat);
    mesh.add(clouds);
  } else if (cloudCoverage > 0) {
    const cloudTex = makeCloudTexture(cloudCoverage);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex, transparent: true, opacity: 0.85, depthWrite: false, roughness: 1,
    });
    clouds = new THREE.Mesh(new THREE.SphereGeometry(size * 1.012, 64, 64), cloudMat);
    mesh.add(clouds);
  }

  // --- Fresnel atmosphere (real rim-light shader, not a flat shell) ---
  if (atmosphereColor !== null) {
    const atmosphere = createAtmosphere(size, atmosphereColor, atmosphereIntensity);
    mesh.add(atmosphere);
  }

  // Small distant-readability halo (kept subtle; the atmosphere shader
  // above does the real work up close)
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture(colorToRgba(atmosphereColor ?? color, 0.22)),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5,
  }));
  glow.scale.set(size * 4.2, size * 4.2, 1);
  mesh.add(glow);

  // --- Saturn/Uranus-style ring: uses a REAL photographic ring texture
  //     when provided (realTextures.ringMap — see main.js/ASSETS.md),
  //     else falls back to the procedural gapped/banded generator.
  //     Radially-mapped UVs, correct tilt, faint painted shadow. ---
  if (hasRing) {
    const inner = size * 1.5, outer = size * 2.6;
    const ringGeo = new THREE.RingGeometry(inner, outer, 128, 1);
    remapRingUVs(ringGeo, inner, outer);
    const ringTex = (realTextures && realTextures.ringMap) ? realTextures.ringMap : makeRingTexture(ringColor ?? color);
    const ringMatProps = {
      map: ringTex, transparent: true, side: THREE.DoubleSide,
      roughness: 1, metalness: 0, depthWrite: false,
    };
    if (realTextures && realTextures.ringAlpha) { ringMatProps.alphaMap = realTextures.ringAlpha; }
    const ringMat = new THREE.MeshStandardMaterial(ringMatProps);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.15;
    // subtle painted shadow band where the planet occludes the ring
    const shadowGeo = new THREE.RingGeometry(inner, inner * 1.35, 64, 1, 0, Math.PI * 0.55);
    remapRingUVs(shadowGeo, inner, inner * 1.35);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.copy(ring.rotation);
    shadow.rotation.z = Math.PI * 0.15;
    mesh.add(ring);
    mesh.add(shadow);
  }

  // --- Satellites (Skills planet — technology moons) ---
  const satellites = [];
  for (let i = 0; i < satelliteCount; i++) {
    const satPivot = new THREE.Object3D();
    satPivot.rotation.y = (i / satelliteCount) * Math.PI * 2;
    satPivot.rotation.x = (Math.random() - 0.5) * 0.6;
    const satGeo = new THREE.OctahedronGeometry(size * 0.15, 1);
    const satMat = new THREE.MeshStandardMaterial({ color: 0xcfd8ee, roughness: 0.8, metalness: 0.1 });
    const sat = new THREE.Mesh(satGeo, satMat);
    sat.position.set(size * 2.5, 0, 0);
    satPivot.add(sat);
    mesh.add(satPivot);
    satellites.push({ pivot: satPivot, speed: 0.5 + Math.random() * 0.5 });
  }

  function update(delta, reduced) {
    if (reduced) return;
    pivot.rotation.y += orbitSpeed * delta;
    mesh.rotation.y += delta * spinSpeed;
    if (clouds) clouds.rotation.y += delta * spinSpeed * 0.4;
    satellites.forEach(s => { s.pivot.rotation.y += s.speed * delta; });
  }

  function getWorldPosition(target = new THREE.Vector3()) {
    mesh.getWorldPosition(target);
    return target;
  }

  return { id, label, pivot, mesh, update, getWorldPosition };
}

function colorToRgba(hex, alpha) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}
