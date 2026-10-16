# ID-Indetails project globe

A cinematic 3D Earth portfolio for ID-Indetails, a software engineering company. A rotating globe carries a marker for every project; picking a marker (or stepping through the projects) turns the globe to that place and shows the project beside it. Built with React, TypeScript, Vite and React Three Fiber, using custom GLSL shaders for the Earth, clouds, atmosphere and stars.

All projects shown are fictional demonstrations, and the About copy is placeholder text for the company to replace.

## Getting started

Requires Node.js 22.12 or newer (Vitest 5 sets the floor; developed on Node 24).

```bash
npm install
npm run dev        # dev server, http://localhost:5173 by default
```

Press `Ctrl+C` in the terminal to stop the dev server.

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Starts the Vite dev server with hot reload.               |
| `npm run build`     | Type-checks (`tsc -b`) then builds to `dist/`.            |
| `npm run preview`   | Serves the production build from `dist/` locally.         |
| `npm run lint`      | Runs ESLint (including the React Hooks / Compiler rules). |
| `npm run typecheck` | Runs `tsc -b` over the app, config and test projects.     |
| `npm test`          | Runs the Vitest unit tests once.                          |

## Rendering approach

`react-globe.gl` was evaluated first and not used:

- Its rotation is a camera orbit driven by `OrbitControls`, which takes over touch input, so phones cannot scroll past the globe.
- A day/night terminator with a camera-relative sun would need a second per-frame loop next to its internal tween and render loop.
- It pulls in `globe.gl`, `three-globe`, `kapsule`, `tween.js` and `three-render-objects`.

Instead the site uses React Three Fiber with custom `ShaderMaterial`s and `frameloop="demand"`. A single `useFrame` driver advances the globe and asks for another frame only while something is moving, so with the rotation paused and nothing moving, the page renders nothing. The markers are DOM buttons projected from the rotating globe once per rendered frame, which keeps them crisp and lets plain CSS style them.

## Architecture

```text
src/
  data/        Typed project model and the data source
  globe/       Everything inside and around the 3D canvas
  components/  Page UI
  hooks/       Small React hooks
  lib/         Pure helpers (geo maths, formatting, WebGL check)
  styles/      Global CSS
```

**`src/data`**

- `project.ts` defines the typed `Project` model (location, status, category, description, optional start date, image and details) and the status labels.
- `demoProjects.ts` holds the fictional demonstration projects.
- `projectSource.ts` exposes `fetchProjects()`, the single swap point for a future API. Callers only see the function, so replacing its body with a request changes nothing else.

**`src/globe`**

- `GlobeStage.tsx` is the DOM side: pointer drag, measuring the layout frame the globe is centred in, the markers, the loading indicator and the notices.
- `GlobeScene.tsx` holds the scene graph and `GlobeDriver`, the single on-demand render loop. It frames the camera, advances the controller, rotates the globe, eases the reveal-in and calls the marker projector.
- `GlobeController.ts` owns the orientation logic: automatic spin, drag with inertia, smooth focus transitions and the holds in between. It takes time as an argument and has no React or three.js dependency.
- `MarkerProjector.ts` projects markers onto the screen each frame, fades out those past the horizon and draws the leader line from the active marker to the project panel.
- `shaders.ts` contains the GLSL; `sceneUniforms.ts` holds the uniforms shared by every globe material (sun direction, atmosphere colour, reveal).
- `Earth.tsx`, `FallbackEarth.tsx`, `Atmosphere.tsx` and `Starfield.tsx` are the scene objects.
- `useEarthTextures.ts` loads the Earth maps outside React Suspense so progress and failure can be shown in the page, and disposes them on unmount.
- `GlobeLayout.ts` carries the measured globe position and size from the DOM to the scene.

**`src/components`** is the page UI: header, explorer, project panel and facts, the previous/next navigator and location list, the rotation toggle, the detail dialog and the About section. **`src/hooks`** has `useProjects`, `useMediaQuery` (including reduced motion) and `useCrossfade`. **`src/lib`** has `geo.ts` (latitude/longitude to a point on the sphere, focus orientation, grouping projects by place), `format.ts` and `webgl.ts`.

## Behaviour

- The featured project is selected on load, with an opening turn onto it.
- The globe spins slowly. The spin pauses for a few seconds after a selection or a drag, then eases back in, and stops while the pointer rests on a marker. A button pauses and resumes it.
- Projects can be stepped with the previous and next buttons or the Left and Right arrow keys. The location list is the keyboard and screen-reader route to every project: the globe markers are pointer-only (`aria-hidden`, `tabIndex={-1}`).
- Projects that share a city share one marker. Singapore has two; selecting that place again moves to its next project.
- Markers past the horizon fade out and leave the accessibility tree.
- With `prefers-reduced-motion`, auto-rotation is off by default, focus jumps instantly, drag has no inertia, the clouds do not drift and the marker pulse is removed. Pressing the rotation button overrides the preference.
- Without WebGL 2 the globe is replaced by a notice and the project list and panel keep working. If the Earth textures fail to load, a procedural graticule globe is shown with a notice.
- Dragging turns the globe. Touch drags only turn it sideways (the canvas allows vertical panning), so the page can still scroll past it.

## Assets and licences

Earth textures in `public/textures` were downloaded from NASA Earth Observatory / Visible Earth and processed with `sharp` (resize, city-light extraction, water mask):

| File                                      | Source                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `earth-day-4k.jpg`, `earth-day-2k.jpg`    | Blue Marble Next Generation, `world.topo.bathy.200412` (5400x2700)                                                      |
| `earth-lights-4k.jpg`                     | Black Marble 2016, `BlackMarble_2016_01deg.jpg` (3600x1800), warm artificial light extracted and bluish terrain removed |
| `earth-clouds-2k.jpg`                     | `cloud_combined_2048.jpg`                                                                                              |
| `earth-water-2k.jpg`                      | GEBCO bathymetry, `gebco_08_rev_bath_5400x2700.jpg`, used as a land/water mask                                          |
| `earth-relief-2k.jpg`                     | GEBCO topography, `gebco_08_rev_elev_5400x2700.jpg`                                                                    |

NASA imagery is in the public domain (credit: NASA Earth Observatory; Blue Marble by Reto Stöckli). The GEBCO-derived maps come from NASA's Blue Marble collection and are credited to GEBCO.

The font is Archivo Variable, via `@fontsource-variable/archivo`, under the SIL Open Font License 1.1.

The project preview images in `public/projects` are original generated SVGs: abstract and free of text.

## Testing

`npm test` runs Vitest over the pure logic: `lib/geo.ts` (coordinate maths, focus orientation, grouping), `lib/format.ts`, `globe/GlobeController.ts` (damping, focus, shortest yaw path, holds, auto-rotation, drag inertia, reduced motion) and sanity checks on `data/demoProjects.ts`, including that every referenced image exists under `public/`. Test files live next to the code as `*.test.ts` and are type-checked by `tsconfig.test.json`.

## Known limitations

- Projects are local demonstration data; there is no API behind `fetchProjects()` yet.
- The sun is fixed relative to the camera, so the lit face and the night limb are a stylised look, not the real time of day.
- The production bundle is a single JavaScript chunk of about 1.17 MB (about 324 kB gzipped), mostly three.js and React Three Fiber, and Vite warns about its size. Loading the globe lazily would split it.
- The 3D view needs WebGL 2. Without it, only the project list and panel are available.
- If the graphics driver drops the WebGL context, the page shows a notice and needs a reload.
