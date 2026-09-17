import * as THREE from "three";

/* ============================================================
   Procedural planetary textures. Everything here is generated on
   an off-screen <canvas> at runtime — no external images, no
   network requests, no licensing concerns, and no texture pop-in.
   Each "type" mimics the readable visual signature of a real
   planet class (rocky/dusty, banded gas giant, ice giant, ocean
   world) while staying stylized enough to fit the universe's palette.
   ============================================================ */

function rgbCss(c, a) { return `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, ${a})`; }
function clamp255(v) { return Math.min(255, Math.max(0, v)); }
function lerpColor(a, b, t) { return a.clone().lerp(b, t); }

function addGrain(ctx, w, h, amount = 10) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] = clamp255(img.data[i] + n);
    img.data[i + 1] = clamp255(img.data[i + 1] + n);
    img.data[i + 2] = clamp255(img.data[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);
}

function wrappedBlob(ctx, x, y, r, w, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - w, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w, y, r, 0, Math.PI * 2); ctx.fill();
}

/* ---------- Rocky / dusty world (Mars-like) ---------- */
function paintRocky(ctx, w, h, base) {
  ctx.fillStyle = rgbCss(base, 1);
  ctx.fillRect(0, 0, w, h);
  // large dark regions (maria-like)
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 30 + Math.random() * 60;
    const shade = base.clone().multiplyScalar(0.6);
    wrappedBlob(ctx, x, y, r, w, rgbCss(shade, 0.35));
  }
  // craters / dust patches
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 2 + Math.random() * 10;
    const shade = base.clone().multiplyScalar(0.55 + Math.random() * 0.9);
    wrappedBlob(ctx, x, y, r, w, rgbCss(shade, 0.5));
  }
  // polar-ish lightening
  const poleGrad = ctx.createLinearGradient(0, 0, 0, h);
  poleGrad.addColorStop(0, "rgba(255,255,255,0.18)");
  poleGrad.addColorStop(0.12, "rgba(255,255,255,0)");
  poleGrad.addColorStop(0.88, "rgba(255,255,255,0)");
  poleGrad.addColorStop(1, "rgba(255,255,255,0.15)");
  ctx.fillStyle = poleGrad;
  ctx.fillRect(0, 0, w, h);
  addGrain(ctx, w, h, 12);
}

/* ---------- Banded gas giant (Jupiter-like) ---------- */
function paintGasBands(ctx, w, h, base, withStorm) {
  const bandCount = 14;
  for (let i = 0; i < bandCount; i++) {
    const y0 = (i / bandCount) * h;
    const bandH = h / bandCount;
    const shade = 0.7 + ((i * 37) % 10) / 10 * 0.6;
    const c = base.clone().multiplyScalar(shade);
    ctx.fillStyle = rgbCss(c, 1);
    ctx.fillRect(0, y0, w, bandH + 1);
  }
  // turbulence: horizontal wavy streaks blended between bands
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * h;
    const x = Math.random() * w;
    const len = 40 + Math.random() * 120;
    const c = base.clone().multiplyScalar(0.6 + Math.random() * 0.8);
    ctx.strokeStyle = rgbCss(c, 0.25);
    ctx.lineWidth = 2 + Math.random() * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * 0.3, y + (Math.random() - 0.5) * 10, x + len * 0.7, y + (Math.random() - 0.5) * 10, x + len, y);
    ctx.stroke();
  }
  if (withStorm) {
    const sx = w * 0.68, sy = h * 0.56, sr = h * 0.11;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    grad.addColorStop(0, "rgba(205,90,60,0.9)");
    grad.addColorStop(0.7, "rgba(180,80,60,0.4)");
    grad.addColorStop(1, "rgba(180,80,60,0)");
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(1.6, 1);
    ctx.translate(-sx, -sy);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  addGrain(ctx, w, h, 8);
}

/* ---------- Smooth ice giant (Uranus/Neptune-like) ---------- */
function paintIceGiant(ctx, w, h, base) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, rgbCss(base.clone().multiplyScalar(1.15), 1));
  grad.addColorStop(0.5, rgbCss(base, 1));
  grad.addColorStop(1, rgbCss(base.clone().multiplyScalar(0.85), 1));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // very subtle bands
  for (let i = 0; i < 5; i++) {
    const y = Math.random() * h;
    const c = base.clone().multiplyScalar(Math.random() > 0.5 ? 1.12 : 0.9);
    ctx.fillStyle = rgbCss(c, 0.12);
    ctx.fillRect(0, y, w, 14 + Math.random() * 20);
  }
  // faint wispy clouds
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 50;
    wrappedBlob(ctx, x, y, r, w, rgbCss(new THREE.Color(0xffffff), 0.05));
  }
  addGrain(ctx, w, h, 6);
}

/* ---------- Ocean world with continents (Earth-like) ---------- */
function paintOceanWorld(ctx, w, h, oceanColor, landColor) {
  ctx.fillStyle = rgbCss(oceanColor, 1);
  ctx.fillRect(0, 0, w, h);
  // continents: clustered irregular blobs
  const clusters = 6;
  for (let c = 0; c < clusters; c++) {
    const cx = Math.random() * w, cy = h * 0.2 + Math.random() * h * 0.6;
    const blobs = 10 + Math.floor(Math.random() * 10);
    for (let i = 0; i < blobs; i++) {
      const x = cx + (Math.random() - 0.5) * 90;
      const y = cy + (Math.random() - 0.5) * 60;
      const r = 8 + Math.random() * 22;
      const shade = landColor.clone().multiplyScalar(0.75 + Math.random() * 0.5);
      wrappedBlob(ctx, x, y, r, w, rgbCss(shade, 0.9));
    }
  }
  // shallow-water fringe glow around coasts (cheap: light blue speckle near land)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 3 + Math.random() * 8;
    wrappedBlob(ctx, x, y, r, w, rgbCss(oceanColor.clone().lerp(new THREE.Color(0xffffff), 0.3), 0.2));
  }
  // ice caps
  ctx.fillStyle = "rgba(240,248,255,0.85)";
  ctx.fillRect(0, 0, w, h * 0.06);
  ctx.fillRect(0, h * 0.94, w, h * 0.06);
  addGrain(ctx, w, h, 6);
}

/** Sparse bright dots for a night-side city-lights emissive map (Earth-like only). */
function paintCityLights(ctx, w, h, landColor) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 130; i++) {
    const x = Math.random() * w;
    const y = h * 0.15 + Math.random() * h * 0.7;
    const r = 0.6 + Math.random() * 1.4;
    ctx.fillStyle = "rgba(255,224,160,0.9)";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

/** Cloud layer: soft white wisps on a transparent-ish backdrop. */
function paintClouds(ctx, w, h, coverage = 0.45) {
  ctx.clearRect(0, 0, w, h);
  const puffs = Math.floor(120 * coverage);
  for (let i = 0; i < puffs; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * 40;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(255,255,255,0.8)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - w, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return { canvas: c, ctx: c.getContext("2d") };
}

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * type: "rocky" | "gasBanded" | "gasStorm" | "iceGiant" | "ocean"
 */
export function makeSurfaceTexture(type, colorHex, opts = {}) {
  const w = 1024, h = 512;
  const { canvas, ctx } = makeCanvas(w, h);
  const base = new THREE.Color(colorHex);

  switch (type) {
    case "gasBanded": paintGasBands(ctx, w, h, base, false); break;
    case "gasStorm": paintGasBands(ctx, w, h, base, true); break;
    case "iceGiant": paintIceGiant(ctx, w, h, base); break;
    case "ocean": paintOceanWorld(ctx, w, h, base, new THREE.Color(opts.landColor || 0x4a7c4a)); break;
    case "rocky":
    default: paintRocky(ctx, w, h, base); break;
  }

  return toTexture(canvas);
}

export function makeCloudTexture(coverage) {
  const w = 1024, h = 512;
  const { canvas, ctx } = makeCanvas(w, h);
  paintClouds(ctx, w, h, coverage);
  const tex = toTexture(canvas);
  return tex;
}

export function makeCityLightsTexture(landColor) {
  const w = 1024, h = 512;
  const { canvas, ctx } = makeCanvas(w, h);
  paintCityLights(ctx, w, h, new THREE.Color(landColor));
  return toTexture(canvas);
}

/**
 * A radial ring texture (Saturn-like): concentric bands of varying
 * opacity/color with visible gaps, encoded so the RingGeometry's
 * remapped radial UV (see planet.js) reads it correctly.
 */
export function makeRingTexture(colorHex) {
  const w = 512, h = 32;
  const { canvas, ctx } = makeCanvas(w, h);
  const base = new THREE.Color(colorHex);
  ctx.clearRect(0, 0, w, h);
  let x = 0;
  while (x < w) {
    const bandWidth = 4 + Math.random() * 26;
    const isGap = Math.random() < 0.22;
    const shade = 0.55 + Math.random() * 0.8;
    const alpha = isGap ? 0.05 + Math.random() * 0.1 : 0.35 + Math.random() * 0.5;
    ctx.fillStyle = rgbCss(base.clone().multiplyScalar(shade), alpha);
    ctx.fillRect(x, 0, bandWidth, h);
    x += bandWidth;
  }
  // soft fade at inner/outer edges
  const fade = ctx.createLinearGradient(0, 0, w, 0);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(0.06, "rgba(0,0,0,0)");
  fade.addColorStop(0.94, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
