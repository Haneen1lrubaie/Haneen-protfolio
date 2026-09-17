import * as THREE from "three";
import { makeRadialTexture } from "./starfield.js";

/**
 * The central star: an animated plasma-noise shader on the surface
 * (real motion, not a static texture), a Fresnel-lit corona shell, and
 * two soft additive glow sprites for the distant/overview read. Bloom
 * post-processing (see main.js) does the rest of the "real star" work.
 */
export function createSun(scene) {
  const group = new THREE.Group();

  const geo = new THREE.SphereGeometry(6, 96, 96);
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 vPos;

      // cheap value-noise (no textures, fully procedural)
      float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p);
        f = f*f*(3.0-2.0*f);
        float n000 = hash(i);
        float n100 = hash(i+vec3(1,0,0));
        float n010 = hash(i+vec3(0,1,0));
        float n110 = hash(i+vec3(1,1,0));
        float n001 = hash(i+vec3(0,0,1));
        float n101 = hash(i+vec3(1,0,1));
        float n011 = hash(i+vec3(0,1,1));
        float n111 = hash(i+vec3(1,1,1));
        return mix(
          mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
          mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
      }
      float fbm(vec3 p) {
        float v = 0.0, a = 0.55;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.05; a *= 0.55; }
        return v;
      }

      void main() {
        vec3 p = normalize(vPos) * 3.0;
        float n = fbm(p + vec3(0.0, 0.0, time * 0.06));
        n += 0.5 * fbm(p * 2.3 - vec3(time * 0.03, 0.0, 0.0));
        vec3 deep = vec3(0.85, 0.28, 0.06);
        vec3 mid = vec3(1.0, 0.62, 0.18);
        vec3 hot = vec3(1.0, 0.93, 0.72);
        vec3 col = mix(deep, mid, smoothstep(0.25, 0.65, n));
        col = mix(col, hot, smoothstep(0.6, 0.95, n));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const core = new THREE.Mesh(geo, material);
  group.add(core);

  const glowTex = makeRadialTexture("rgba(255,214,140,0.95)");
  const innerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  innerGlow.scale.set(19, 19, 1);
  group.add(innerGlow);

  const midGlowTex = makeRadialTexture("rgba(255,170,90,0.5)");
  const midGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: midGlowTex, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  midGlow.scale.set(34, 34, 1);
  group.add(midGlow);

  const outerGlowTex = makeRadialTexture("rgba(120,150,255,0.28)");
  const outerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: outerGlowTex, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  outerGlow.scale.set(60, 60, 1);
  group.add(outerGlow);

  // Physical light source for the whole solar system
  const light = new THREE.PointLight(0xfff2d6, 4.2, 0, 1.4);
  light.position.set(0, 0, 0);
  group.add(light);

  scene.add(group);

  function update(delta, elapsed) {
    material.uniforms.time.value = elapsed;
    core.rotation.y += delta * 0.02;
    const pulse = 1 + Math.sin(elapsed * 0.55) * 0.04;
    innerGlow.scale.set(19 * pulse, 19 * pulse, 1);
    midGlow.scale.set(34 * (1 + Math.sin(elapsed * 0.4 + 1) * 0.03), 34 * (1 + Math.sin(elapsed * 0.4 + 1) * 0.03), 1);
  }

  return { group, core, update };
}
