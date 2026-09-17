# Haneen Alrubaie — Portfolio Universe

A full cinematic redesign of the portfolio as an interactive solar system.
All content (projects, skills, experience, contact info) is the same real
content from the previous version — only the presentation changed.

## Visual quality upgrade (previous pass)

The planets, star, and space environment were substantially upgraded for
realism — see `ASSETS.md` for exactly how:
- Each planet now has a real procedurally-generated surface (oceans +
  continents for About, banded gas-giant surfaces for Projects/Skills,
  a smooth ice-giant look for Experience, a dusty rocky look for
  Contact), a proper Fresnel-shader atmosphere (not a flat glowing
  shell), and its own rotation speed.
- Projects' ring is a real gapped/banded ring texture (Saturn-style),
  not a solid-color torus.
- The Sun has an animated plasma-noise shader surface instead of a
  static texture.
- Stars are round soft sprites in varied colors/sizes/brightness
  across 3 depth layers with real camera-driven parallax, instead of
  uniform square dots.
- Cinematic Unreal Bloom post-processing + ACES filmic tone mapping on
  desktop (automatically skipped on mobile for performance).

## Latest update: real Earth imagery + full responsive overhaul

- The **About planet now uses real, verified NASA-derived Earth
  photography** (day map, normal map, specular map, night-side city
  lights, clouds) downloaded from three.js's official repository and
  stored locally in `assets/textures/planets/earth/`, loaded with a
  `THREE.LoadingManager` (the intro screen shows real load progress and
  won't block more than 4s even on a slow connection).
- I could **not** integrate downloaded GLB/GLTF models from Sketchfab —
  that site isn't reachable from my build environment, and I won't
  fabricate a licensing chain I can't verify. Full reasoning is in
  `ASSETS.md`, including why textured spheres are actually the correct/
  standard technique for planets specifically (not a compromise).
- **Responsive overhaul:** the camera's overview distance and each
  flight's viewing distance now scale with the viewport's aspect ratio
  (not just a flat shrink), so portrait phones pull the camera back
  automatically instead of clipping planets off-screen. Resize *and*
  orientation-change are both handled. Added breakpoints for very small
  phones, short landscape viewports, and ultra-wide monitors.

## Latest update: all five planets now use real photographic textures

Every planet — not just Earth — now uses real, verified, MIT-licensed
photographic textures instead of procedurally-painted surfaces: Saturn
and Uranus include their real rings (with real gap/alpha maps), Mars
has a real bump map, Jupiter shows its real cloud bands. Full source/
license/attribution table in `ASSETS.md`. I could not use downloaded
GLB/GLTF models (Sketchfab isn't reachable from my build environment,
and — more importantly — textured spheres are the technically correct
approach for planets specifically, not a compromise); that reasoning is
also in `ASSETS.md`. Nothing about positions, camera behavior, navigation,
or animations changed — only the planet surface materials.

## Run it

Same as before — needs a static server (browsers block ES module imports
over `file://`):

```bash
py -m http.server 8080      # Windows
# or
python3 -m http.server 8080 # Mac/Linux
```

Open `http://localhost:8080`. On any static host (Vercel, Netlify, GitHub
Pages…) it works with zero configuration.

## What's actually in the universe

- **Opening sequence** — dark space, your name/title fade in, "Enter My
  Universe" (skippable).
- **Solar system overview** — a glowing sun (you/home) with 5 orbiting
  planets, one per section: **About, Projects, Skills, Experience,
  Contact**. Each planet has a distinct identity (Projects has a ring;
  Skills has orbiting satellites; each a different color/size). Planets
  keep slowly orbiting and spinning the whole time — it's a living scene,
  not a static background.
- **Cinematic camera travel** — clicking a planet (in the HUD or directly
  in the 3D scene) flies the camera there with eased motion and a subtle
  speed-pulse, then the section's content panel fades in. "Return to
  Universe" reverses it.
- **Projects → orbital field** — real project cards (your actual
  descriptions, roles, tech, images, live/GitHub links) in a radial
  layout with magnetic hover; clicking one opens a full case-study view.
  Category filter chips still work.
- **Skills → constellation** — your skill groups as hub nodes arranged in
  a circle; hovering a hub reveals its technologies as connected nodes.
- **Experience → orbital timeline** — your capabilities laid out along a
  glowing vertical line that lights up as you scroll into view.
- **Contact → transmission console** — your real contact channels +
  a working form (same honest behavior as before: no fake backend, opens
  the visitor's email client, shows "Transmission sent").
- **Depth**: 3 layers of parallax starfield, soft nebula haze, and
  occasional shooting stars — all GPU-cheap (no textures to download, no
  post-processing pipeline).
- **Custom cursor** on desktop (a small ring that expands over
  interactive elements); automatically disabled on touch devices.
- **Accessibility**: `prefers-reduced-motion` disables camera flights,
  planet motion, and shooting stars — content is still fully reachable,
  just presented with simple fades instead.
- **Mobile**: fewer stars, no shooting stars, no custom cursor, layout
  reflows — same universe, tuned for weaker GPUs and touch.

## What I deliberately left out (and why)

You asked for wow-factor over quantity, so I scoped out a few things that
would have added risk/weight without adding much:

- **No full bloom/post-processing pipeline.** Real bloom needs extra
  Three.js addon modules and a render-target pass — heavier and slower
  for little extra payoff. I got a very similar glow using additive
  blended sprites (cheap, GPU-friendly, no extra downloads).
- **No literal 3D holographic project cards.** Per your own note in the
  brief — "use WebGL for the universe, normal HTML/CSS for text/interface
  content" — the project panels are real HTML/CSS (in an orbital radial
  layout), which keeps them accessible, indexable, and fast, while still
  feeling like part of the universe.
- **No sound.** There's no ambient audio asset to use, and a synthesized
  hum risked feeling cheap rather than premium. The architecture has a
  clear spot to add a mute-by-default ambient track later if you get one.
- **No literal orbiting 3D project satellites** — same reasoning as
  above; the radial HTML layout gives the same "orbit" feeling without
  the performance/accessibility cost of real WebGL objects per project.

## Architecture

```
index.html
css/style.css              all visual styling (space theme, HUD, panels)
js/
  data.js                  YOUR CONTENT — edit this for text/links/projects
  hud.js                   HUD, navigation, panel content, intro, cursor, contact form
  universe/
    main.js                scene setup, camera travel system, public API
    starfield.js            starfield + nebula
    sun.js                   the central star
    planet.js                reusable planet (orbit, spin, ring, satellites)
    shootingStar.js           rare shooting-star detail
assets/images/projects/*.svg  project images (same as before — replace anytime)
assets/textures/planets/*  real downloaded planet textures — earth/mars/jupiter/saturn/uranus (see ASSETS.md)
```

To change **content** (name, links, projects, skills, experience, contact):
edit `js/data.js` only, exactly like the previous version — nothing else
needs to change.

To change the **visual language** of the universe (colors, sizes, orbit
speeds, which planet has a ring/satellites): edit `js/universe/main.js`,
in the `planetDefs` array near the top.
