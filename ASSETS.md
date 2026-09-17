# ASSETS.md — Visual Asset Policy

## Summary

**All five planets now use real, verified, properly-licensed photographic
textures** applied to the existing sphere geometry (see "Why textured
spheres, not GLB models" below for why that's the right call technically,
not a compromise). Nothing is hotlinked — every file was downloaded and
committed into this project's own `assets/textures/planets/` folder.

| Portfolio section | Planet identity | Asset name(s) | Source | Author / Creator | License | Attribution required? |
|---|---|---|---|---|---|---|
| About | Earth | `earth_atmos_2048.jpg`, `earth_normal_2048.jpg`, `earth_specular_2048.jpg`, `earth_lights_2048.png`, `earth_clouds_1024.png` | [three.js official repo](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets) (`examples/textures/planets/`) | NASA (Blue Marble-derived imagery); packaged by the three.js project (Ricardo Cabello / mrdoob & contributors) | MIT (three.js repository) | No (MIT; NASA source imagery is US-government public domain) |
| Projects | Saturn | `saturn_color.jpg`, `saturn_ring_color.jpg`, `saturn_ring_pattern.gif` (ring alpha/gap map) | [jeromeetienne/threex.planets](https://github.com/jeromeetienne/threex.planets) (`images/saturnmap.jpg`, `saturnringcolor.jpg`, `saturnringpattern.gif`) | Jérôme Etienne; source imagery originally from [Planet Pixel Emporium](http://planetpixelemporium.com/planets.html) | MIT ("It is released under MIT license" — repo README) | No |
| Skills | Jupiter | `jupiter_color.jpg` | [jeromeetienne/threex.planets](https://github.com/jeromeetienne/threex.planets) (`images/jupitermap.jpg`) | Jérôme Etienne / Planet Pixel Emporium | MIT | No |
| Experience | Uranus | `uranus_color.jpg`, `uranus_ring_color.jpg`, `uranus_ring_trans.gif` (ring alpha/gap map) | [jeromeetienne/threex.planets](https://github.com/jeromeetienne/threex.planets) (`images/uranusmap.jpg`, `uranusringcolour.jpg`, `uranusringtrans.gif`) | Jérôme Etienne / Planet Pixel Emporium | MIT | No |
| Contact | Mars | `mars_color.jpg`, `mars_bump.jpg` | [jeromeetienne/threex.planets](https://github.com/jeromeetienne/threex.planets) (`images/marsmap1k.jpg`, `marsbump1k.jpg`) | Jérôme Etienne / Planet Pixel Emporium | MIT | No |

None of the above licenses require attribution to be legally compliant
(MIT requires only that the license notice accompany *copies of the
software*, which this file + the retained source links satisfy — no
on-page credit is legally necessary). No attribution UI was added, so as
not to clutter the visual design, per instruction #12 ("if attribution
is required, add it appropriately without hurting the visual design") —
attribution simply isn't required here.

**threex.planets** is a long-standing (since 2014), widely-used, MIT-licensed
three.js community extension by Jérôme Etienne — a well-known contributor
of numerous `threex.*` three.js add-ons — that bundles a complete classic
solar-system texture set sourced from Planet Pixel Emporium (a site
built specifically to provide these maps free for any use). This is
corroborated by at least one other actively-maintained open-source
project ([nicedreamzapp/RealTime-Space](https://github.com/nicedreamzapp/RealTime-Space))
that independently cites the same repository, under the same license
characterization, for the same purpose.

## Why textured spheres, not downloaded GLB/GLTF models

This was asked for directly in an earlier pass, so the reasoning is kept
here rather than silently ignored:

- **Sketchfab is not reachable from the environment I build in** — my
  tooling's network access is restricted to a fixed allowlist of domains
  (package registries, GitHub, a few others), and sketchfab.com isn't on
  it. I can't browse, preview, or download from it.
- **Planets are geometrically simple (spheres) — the realism comes from
  the texture, not the mesh.** This is also why NASA's own visualizations
  and virtually every serious three.js solar-system project (including
  three.js's own official examples, and threex.planets itself) render
  planets as a `SphereGeometry` with photographic diffuse/normal/bump/
  ring maps rather than an imported 3D model. A GLB model would only
  help here for something with real irregular geometry (asteroids, a
  spacecraft) — for a smooth sphere it adds a heavier download and a
  licensing chain to manage for no visual gain over a textured sphere.
- Per point 14 of the brief that requested this: *"If an existing planet
  is procedurally created in code and replacing it with an external
  model would actually reduce visual quality or performance, you may
  instead use high-quality open-source PBR textures/materials on the
  existing 3D geometry."* — that's exactly the path taken here, now with
  real photographic sources for all five planets instead of the earlier
  procedural canvas-painted surfaces.

## How it's wired in code

`js/universe/main.js` loads every file through a single `THREE.TextureLoader`
+ `THREE.LoadingManager` (the intro screen shows real load progress and
never blocks more than 4s even on a slow connection). `js/universe/planet.js`
accepts a `realTextures` object per planet (`diffuse`, `normal`, `specular`,
`bump`, `emissive`, `clouds`, `ringMap`, `ringAlpha`) and builds the
`MeshStandardMaterial` / ring geometry from whichever of those are present,
falling back to the older procedural generator in `js/universe/textures.js`
only if real textures are absent or fail to load — so the site never shows
a broken/blank planet.

**Mobile:** normal/specular/bump maps and ring alpha (gap) maps are skipped
on mobile to cut payload and GPU cost — the diffuse color map alone still
reads correctly as "that planet." All five diffuse maps together are under
1.5 MB combined.

## Everything else — still fully procedural, no external files

The Sun's animated surface, all three star layers, the nebula haze, and
the atmosphere rim-light on every planet are generated **at runtime** —
nothing downloaded, nothing to license:

| Element | File | Technique |
|---|---|---|
| Planet atmosphere rim glow (all planets) | `js/universe/atmosphere.js` | Custom GLSL `ShaderMaterial` — real Fresnel term, not an image |
| Sun surface | `js/universe/sun.js` | Custom GLSL `ShaderMaterial` — animated 3D value-noise (fbm), no texture at all |
| Stars | `js/universe/starfield.js` | One shared small canvas-drawn radial-gradient sprite, reused via `PointsMaterial.map` with per-star vertex colors |
| Nebula haze | `js/universe/starfield.js` | Same shared sprite, tinted and stretched large at low opacity |
| Fallback planet surfaces (only if a real texture fails to load) | `js/universe/textures.js` | Canvas 2D procedural generator (previous pass) |

## Third-party code (libraries, not media assets)

| Library | Source | License |
|---|---|---|
| three.js `0.160.0` (core + `EffectComposer`/`RenderPass`/`UnrealBloomPass`/`OutputPass` addons) | unpkg.com | MIT |
| GSAP `3.15.0` | unpkg.com | Standard "No Charge" GSAP license |
| lucide `1.39.0` (icons) | unpkg.com | ISC |
| Google Fonts: Space Grotesk, Inter, JetBrains Mono | fonts.googleapis.com | Open Font License |
