# ID-Indetails project globe

A 3D Earth landing page for ID-Indetails, an architecture studio. A grey dotted globe sits beside a slowly drifting strip of project photographs; as each project passes the centre of the strip, the globe turns to its place. Opening a project slides the strip away and zooms the globe in until only its horizon remains, with the project's page below it. Built with React, TypeScript, Vite and React Three Fiber, using custom GLSL shaders for the Earth, markers, routes and stars.

All projects shown are illustrative: names, clients and details are invented, and the photographs are free-licence stock images credited on each project page.

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

Instead the site uses React Three Fiber with custom `ShaderMaterial`s and `frameloop="demand"`. A single `useFrame` driver advances the globe and asks for another frame only while something is moving or the marker ripples are playing; with motion paused or the globe scrolled out of view, the page renders nothing. The blue markers and route arcs are drawn in the scene; invisible DOM buttons on top of them are projected from the rotating globe once per rendered frame and carry the click targets.

## Architecture

```text
src/
  data/        Typed project model and the data source
  globe/       Everything inside and around the 3D canvas
  components/  Page UI
  hooks/       Small React hooks
  lib/         Pure helpers (geo maths, seeded random, WebGL check)
  styles/      Global CSS
```

**`src/data`**

- `project.ts` defines the typed `Project` model (type, status, location, year, client, floor area, services, summary, brief, design concept, materials, sustainability, photographs with credits, team) and the type and status labels.
- `demoProjects.ts` holds the illustrative projects. Each project's photographs live in `public/projects/<id>/`: `thumb.jpg` (portrait crop for the strip), `hero.jpg`, `gallery-1.jpg` and `gallery-2.jpg`.
- `projectSource.ts` exposes `fetchProjects()`, the single swap point for a future API. Callers only see the function, so replacing its body with a request changes nothing else.

**`src/components`**

- `Explorer.tsx` is the page: the globe, the caption and controls, the strip, and the project page. It decides which view shows and keeps the globe, strip and address bar in step.
- `ProjectStrip.tsx` is the endless strip. Its position is a number of cards (`offset`); the card nearest the centre is the current project. A `requestAnimationFrame` loop drifts it, settles it with a critically damped spring and writes transforms straight to the DOM; React re-renders only when a new card needs mounting. Vertical on wide screens, horizontal below 960 px.
- `ProjectCaption.tsx` is the name, place and summary beside the strip; `ProjectPage.tsx` holds `ProjectHeading` (the title over the globe's close-up) and `ProjectPage` (the page below it).
- `SiteHeader.tsx`, `AboutSection.tsx`, `MotionToggle.tsx`, `ScrollLink.tsx` and `icons.tsx` are the rest of the page.

**`src/globe`**

- `GlobeStage.tsx` is the DOM side: pointer drag, measuring the layout frame the globe is centred in, the marker click targets, the loading indicator and the notices. It pauses the ripples while the globe is off screen.
- `GlobeScene.tsx` holds the scene graph and `GlobeDriver`, the single on-demand render loop. It frames the camera (`framing.ts`), advances the controller and the layout, rotates and tips the globe, eases the reveal-in and calls the marker projector.
- `GlobeLayout.ts` carries the measured globe position and size from the DOM to the scene. When the layout cell changes (for example the whole hero becoming the frame as a project opens), the globe glides to it instead of jumping.
- `framing.ts` places the camera. At zoom 0 the whole globe fills the layout cell; at zoom 1 the camera moves in and a lens shift puts the selected place just under the horizon, which curves across the top of the hero.
- `GlobeController.ts` owns the orientation logic: drag with inertia, smooth focus transitions and the zoom (0 overview, 1 close-up). The close-up is switched on only while a project page is open; the zoom stays out while a turn has more than about 0.45 rad to go and moves in once the place is close. It takes time as an argument and has no React or three.js dependency. It still supports an automatic spin, which the page leaves off: the globe follows the strip instead.
- `Earth.tsx` draws the planet in two passes over one sphere: the far hemisphere first, faintly, then the near side, which writes depth so markers and routes behind the planet stay hidden although the oceans are see-through. `shaders.ts` turns the land/sea mask into a grid of round dots in rows of equal latitude, each dot read once at its centre, and fades the grid to an even tone where the dots get too small to draw cleanly.
- `MarkerBeacons.tsx` draws a small blue dot with two rippling rings for each place; the selected place is larger and brighter. `Routes.tsx` draws faint dashed great-circle arcs along a minimum spanning tree of the places (`minimumSpanningTree` in `lib/geo.ts`). Ripples and route flow stop when motion is paused or reduced (`effectUniforms.ts`).
- `MarkerProjector.ts` places the invisible marker buttons over the dots once per rendered frame and hides those past the horizon.
- `Dust.tsx` and `Starfield.tsx` are the particles around the globe and the stars behind it; `FallbackEarth.tsx` is the graticule globe shown if the mask cannot load.
- `useEarthTextures.ts` loads the land/sea mask outside React Suspense so failure can be shown in the page, and disposes it on unmount.

**`src/hooks`** has `useProjects`, `useProjectRoute` (the project in the address bar), `useMediaQuery` (including reduced motion) and `useCrossfade`.

## Behaviour

- **Landing.** The globe sits on the left, the strip on the right (below the globe on narrow screens), and the caption between them names the current project. The strip starts drifting straight away, about eight seconds per project, lingering as each card passes the centre; new projects arrive from the top. The globe turns to each project as it becomes current.
- **Choosing.** The strip can be scrolled with the wheel or trackpad, dragged and flung; the Previous and Next buttons and the Left and Right arrow keys step through projects. After any of these the drift waits about six seconds, then carries on. It also waits while the mouse rests on the strip. The strip loops forever. The Pause button stops the drift and the ripples.
- **Opening a project.** Clicking a card, a blue dot on the globe or View project opens that project. The strip slides off to the right and the caption fades, the globe glides to the centre of the screen, turns to the place and moves in until only its horizon is left, with the project's title over it. The project page follows below: photographs, the key facts, the brief, the design concept, materials, sustainability, credits, an enquiry prompt and the previous and next projects. Previous and next keep the close-up and turn the globe to the new place. All projects, the wordmark, Projects in the header or Escape go back; the globe zooms out and the strip returns at the same project.
- **Addresses.** Each project has its own address, `/projects/<id>`, but the page never reloads: opening and closing use the History API, so links can be shared and the browser's Back and Forward buttons move between the globe and a project with the same animations. Moving between projects replaces the entry, so Back always returns to the globe. An address for an unknown project falls back to the globe.
- **Keyboard and screen readers.** The strip and the globe markers are pointer-only (`aria-hidden`, `tabIndex={-1}`); the caption's View project button and the Previous and Next buttons reach every project, and a live region announces the current one. The skip link jumps to those controls.
- **Reduced motion.** With `prefers-reduced-motion` the strip does not drift and jumps instead of gliding, the globe jumps to each place and in and out of the close-up, the ripples are replaced by a still ring and the page transitions are near-instant.
- Without WebGL 2 the globe is replaced by a notice and the strip and project pages keep working. If the land/sea mask fails to load, a graticule globe is shown with a notice.

## Hosting

Because project addresses are real paths (`/projects/alfama-lofts`), the web server must answer any unknown path with `index.html` (the usual single-page-app fallback). Vite's dev and preview servers already do this. The site expects to be served from the root of its domain.

## Assets and licences

The land/sea mask in `public/textures` (`earth-water-4k.jpg`, `earth-water-2k.jpg`) was made from GEBCO bathymetry (`gebco_08_rev_bath_21600x10800.jpg`, from NASA's Blue Marble collection), thresholded at full resolution and united with blue pixels from Blue Marble Next Generation so shallow seas (Azov, North Sea) count as water. NASA imagery is in the public domain (credit: NASA Earth Observatory; Blue Marble by Reto Stöckli); the GEBCO-derived mask is credited to GEBCO.

The project photographs in `public/projects` are free-licence images from Pexels (Pexels License), downloaded at reduced size. Each photograph's photographer and source page are recorded in `demoProjects.ts` and credited on its project page. The projects themselves are invented; the photographs do not show the buildings described.

The font is Archivo Variable, via `@fontsource-variable/archivo`, under the SIL Open Font License 1.1.

## Testing

`npm test` runs Vitest over the pure logic: `lib/geo.ts` (coordinate maths, focus orientation, grouping), `globe/GlobeController.ts` (damping, focus, shortest yaw path, drag inertia, the close-up zoom, reduced motion), `hooks/useProjectRoute.ts` (reading and writing project addresses) and sanity checks on `data/demoProjects.ts`, including that every referenced photograph exists under `public/`, has alt text and a credit, and is used only once. Test files live next to the code as `*.test.ts` and are type-checked by `tsconfig.test.json`.

## Known limitations

- Projects are local demonstration data; there is no API behind `fetchProjects()` yet.
- The sun is fixed relative to the camera, so the lit face is a stylised look, not the real time of day.
- The production bundle is a single JavaScript chunk, mostly three.js and React Three Fiber, and Vite warns about its size. Loading the globe lazily would split it.
- The 3D view needs WebGL 2. Without it, only the strip, captions and project pages are available.
- If the graphics driver drops the WebGL context, the page shows a notice and needs a reload.
- While the ripples play, the globe renders every frame; it stops when motion is paused or the globe is scrolled out of view.
