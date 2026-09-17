import * as THREE from "three";

/**
 * A physically-inspired Fresnel rim-light atmosphere: a slightly larger
 * shell around the planet that only glows near the silhouette edge (where
 * the view direction is near-perpendicular to the surface normal), the
 * way real atmospheric scattering reads from a distance. Cheap (one
 * extra mesh, no render target) and looks dramatically better than a
 * flat translucent sphere.
 */
export function createAtmosphere(size, colorHex, intensity = 1) {
  const geometry = new THREE.SphereGeometry(size * 1.16, 48, 48);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(colorHex) },
      intensity: { value: intensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        float glow = pow(rim, 2.6) * intensity;
        gl_FragColor = vec4(glowColor, glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });

  return new THREE.Mesh(geometry, material);
}
