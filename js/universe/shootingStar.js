import * as THREE from "three";

const active = [];

/** Spawns a brief streak of light that crosses the scene and fades out. */
export function maybeSpawnShootingStar(scene, elapsed, chancePerSecond = 0.06) {
  if (active.length >= 2) return;
  if (Math.random() > chancePerSecond / 60) return;

  const start = new THREE.Vector3(
    (Math.random() - 0.5) * 500,
    120 + Math.random() * 120,
    (Math.random() - 0.5) * 500
  );
  const dir = new THREE.Vector3(-1, -0.4, -0.3).normalize();
  const length = 40 + Math.random() * 30;
  const end = start.clone().add(dir.clone().multiplyScalar(length));

  const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
  const mat = new THREE.LineBasicMaterial({ color: 0xdfefff, transparent: true, opacity: 0.9 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);

  active.push({ line, born: elapsed, life: 0.9, dir, speed: 220 });
}

export function updateShootingStars(scene, elapsed, delta) {
  for (let i = active.length - 1; i >= 0; i--) {
    const s = active[i];
    const age = elapsed - s.born;
    const t = age / s.life;
    if (t >= 1) {
      scene.remove(s.line);
      s.line.geometry.dispose();
      s.line.material.dispose();
      active.splice(i, 1);
      continue;
    }
    s.line.position.addScaledVector(s.dir, s.speed * delta);
    s.line.material.opacity = 0.9 * (1 - t);
  }
}
