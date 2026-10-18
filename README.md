# ID-Indetails project globe

A 3D Earth landing page for ID-Indetails, an architecture studio. A dark globe with country borders sits beside a slowly drifting strip of project photographs; as each project passes the centre of the strip, the globe turns to its place and that country's border glows cyan. Opening a project fades the strip out and its photograph back in as a panel on the right while the planet slides into the bottom-left corner, leaning so its edge runs diagonally, and zooms in on the place, with the project's page below. Two red points mark the studio's offices. A Studio page lists what the studio does, and a Contact page has an enquiry form, phone numbers and each office on a Google map. Built with React, TypeScript, Vite and React Three Fiber, using custom GLSL shaders for the Earth, markers, routes and stars.

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
  lib/         Pure helpers (geo maths, country outlines, seeded random, WebGL check)
  styles/      Global CSS
```

**`src/data`**

- `project.ts` defines the typed `Project` model: images (with credits), description, status (completed or in progress), client organisation, location, year, and a type (villa, residential, hotel), with their labels.
- `demoProjects.ts` holds the illustrative projects. Each project's photographs live in `public/projects/<id>/`: `thumb.jpg` (portrait crop for the strip), `hero.jpg`, `gallery-1.jpg` and `gallery-2.jpg`.
- `projectSource.ts` exposes `fetchProjects()`, the single swap point for a future API. Callers only see the function, so replacing its body with a request changes nothing else.
- `site.ts` holds the company details shown across the site (contact email, social links, services) and `offices.ts` the studios (position, address, phone). **Every value in both is a placeholder**; these two files are the place to put the real details.
- `contactSource.ts` exposes `sendContactMessage()`, the swap point for the ID-Indetails server. It is not connected yet and always fails with `ContactNotConnectedError`, so the form tells visitors to email instead of losing their message.

**`src/components`**

- `Explorer.tsx` is the page: the globe, the caption and controls, the strip, and the project page. It decides which view shows and keeps the globe, strip and address bar in step.
- `ProjectStrip.tsx` is the endless strip. Its position is a number of cards (`offset`); the card nearest the centre is the current project. A `requestAnimationFrame` loop drifts it, settles it with a critically damped spring and writes transforms straight to the DOM; React re-renders only when a new card needs mounting. Vertical on wide screens, horizontal below 960 px.
- `ProjectCaption.tsx` is the name, place and summary beside the strip. `ProjectDock.tsx` is the photograph held to the right of the globe on a project page; it fades in with the Web Animations API once the strip has faded out, animating only opacity and `transform` so the GPU compositor keeps it smooth while the page sets up the project view. `ProjectPage.tsx` holds `ProjectHeading` (the title at the top left, above the globe's close-up) and `ProjectPage` (the page below it).
- `StudioPage.tsx` and `ContactPage.tsx` are the other two pages; `ContactForm.tsx` is the enquiry form (its checks are in `lib/contactForm.ts`). The maps are Google's keyless embed of each office's coordinates, darkened with a CSS filter to suit the site.
- `SiteHeader.tsx`, `SiteFooter.tsx` (social links), `PageLink.tsx`, `MotionToggle.tsx`, `ScrollLink.tsx` and `icons.tsx` are the rest of the page.

**`src/globe`**

- `GlobeStage.tsx` is the DOM side: pointer drag, measuring the layout frame the globe is centred in, the marker click targets, the loading indicator and the notices. It pauses the ripples while the globe is off screen.
- `GlobeScene.tsx` holds the scene graph and `GlobeDriver`, the single on-demand render loop. It frames the camera (`framing.ts`), advances the controller and the layout, rotates and tips the globe, eases the reveal-in and calls the marker projector.
- `GlobeLayout.ts` carries the measured globe position and size from the DOM to the scene. When the layout cell changes (for example the whole hero becoming the frame as a project opens), the globe glides to it instead of jumping.
- `framing.ts` places the camera. At zoom 0 the whole globe fills the layout cell; at zoom 1 the camera moves in, the globe leans further and a lens shift puts the planet's centre below and left of the cell, so the planet rises from the bottom-left corner with its edge running diagonally and the selected place near that edge. Phones use their own placement so the place stays on screen.
- `GlobeController.ts` owns the orientation logic: drag with inertia, smooth focus transitions and the zoom (0 overview, 1 close-up). The close-up is switched on only while a project page is open; the zoom stays out while a turn has more than about 0.45 rad to go and moves in once the place is close. It takes time as an argument and has no React or three.js dependency. It still supports an automatic spin, which the page leaves off: the globe follows the strip instead.
- `Earth.tsx` draws the planet in two passes over one sphere: the far hemisphere first, faintly, then the near side, which writes depth so markers, borders and routes behind the planet stay hidden although the oceans are see-through. The land is a flat, dark tone from a land mask, kept dim so the project locations draw the eye. `shaders.ts` also adds the selected country's soft cyan glow from a highlight mask.
- `CountryBorders.tsx` draws coastlines and land borders as plain one-pixel grey lines (about 75,000 segments, so wide lines for all of them would cost frames while the globe moves), and the selected country's outline in cyan with a set pixel width (`LineSegments2` from three's examples). The glow around it is not a wide line, whose overlapping segments would flare at every joint, but a band the Earth shader finds in a texture holding the country and a blurred copy of it (`createHighlightTexture`).
- `OfficeMarkers.tsx` draws the studios as still red dots; their "ID-Indetails" labels are DOM elements placed by the marker projector.
- `MarkerBeacons.tsx` draws a small blue dot with two rippling rings for each place; the selected place is larger and brighter. `Routes.tsx` draws faint dashed great-circle arcs along a minimum spanning tree of the places (`minimumSpanningTree` in `lib/geo.ts`). Ripples and route flow stop when motion is paused or reduced (`effectUniforms.ts`).
- `MarkerProjector.ts` places the invisible marker buttons over the dots once per rendered frame and hides those past the horizon.
- `Dust.tsx` and `Starfield.tsx` are the particles around the globe and the stars behind it; `FallbackEarth.tsx` is the graticule globe shown if the mask cannot load.
- `useCountryData.ts` loads the country outlines outside React Suspense so failure can be shown in the page, draws the land mask onto a canvas and disposes it on unmount. `lib/countries.ts` decodes the outlines, finds the country a place is in (with a nearest-outline fallback for islands too small for the map) and turns lines into segments on the sphere.

**`src/hooks`** has `useProjects`, `useSiteRoute` (the page and the open project in the address bar), `useMediaQuery` (including reduced motion) and `useCrossfade`.

## Behaviour

- **Landing.** The globe sits on the left, the strip right beside it, and the caption on the far right names the current project (on narrow screens the strip runs sideways below the globe, with the caption under it). The selected project's country border glows cyan. The strip starts drifting straight away, about eight seconds per project, lingering as each card passes the centre; new projects arrive from the top. The globe turns to each project as it becomes current.
- **Choosing.** The strip can be scrolled with the wheel or trackpad, dragged and flung; the Previous and Next buttons and the Left and Right arrow keys step through projects. After any of these the drift waits about six seconds, then carries on. It also waits while the mouse rests on the strip. The strip loops forever. The Pause button stops the drift and the ripples.
- **Opening a project.** Clicking a card, a blue dot on the globe or View project opens that project. The strip and the caption fade out, and the project's photograph fades back in as a panel on the right; the planet glides into the bottom-left corner, leaning so its edge runs diagonally, turns to the place and moves in, with the project's title above it at the top left. The page also scrolls down by the header's height, so the header moves out of sight and the whole photograph shows. On narrow screens there is no room beside the globe, so the photograph opens the page below instead. The project page follows below: photographs, the key facts, the brief, the design concept, materials, sustainability, credits, an enquiry prompt and the previous and next projects. Previous and next keep the close-up and turn the globe to the new place. All projects, the wordmark, Projects in the header or Escape go back; the globe zooms out and the strip returns at the same project.
- **Pages and addresses.** The site has four kinds of address: `/` (the globe), `/projects/<id>`, `/studio` and `/contact`. The page never reloads: moving between them uses the History API, so links can be shared and the browser's Back and Forward buttons move between them with the same animations. Moving between projects replaces the entry, so Back always returns to where the first project was opened from. An unknown address falls back to the globe. The globe stays mounted, hidden and idle, behind the Studio and Contact pages, so it is ready the moment you come back.
- **Contact form.** Name, email and message are required; phone is optional. Mistakes are shown beside each field and the first one is focused; corrected fields clear as you type. Sending is not connected yet, so a valid message ends with a note asking the visitor to email instead.
- **Keyboard and screen readers.** The strip and the globe markers are pointer-only (`aria-hidden`, `tabIndex={-1}`); the caption's View project button and the Previous and Next buttons reach every project, and a live region announces the current one. The skip link jumps to the main content of whichever page is showing.
- **Reduced motion.** With `prefers-reduced-motion` the strip does not drift and jumps instead of gliding, the globe jumps to each place and in and out of the close-up, the ripples are replaced by a still ring and the page transitions are near-instant.
- Without WebGL 2 the globe is replaced by a notice and the strip and project pages keep working. If the country outlines fail to load, a graticule globe is shown with a notice.
- **Offices.** Red points mark the studios in Beirut and Abidjan (`data/offices.ts`), each labelled ID-Indetails. They do not move and cannot be clicked.

## Hosting

Because the addresses are real paths (`/studio`, `/projects/alfama-lofts`), the web server must answer any unknown path with `index.html` (the usual single-page-app fallback). Vite's dev and preview servers already do this. The site expects to be served from the root of its domain.

## Assets and licences

Country outlines come from Natural Earth (public domain) at 1:50m scale, via the `world-atlas` package (`countries-50m.json`, emitted as a static asset and fetched at runtime) and decoded with `topojson-client`.

The project photographs in `public/projects` are free-licence images from Pexels (Pexels License), downloaded at reduced size. Each photograph's photographer and source page are recorded in `demoProjects.ts` and credited on its project page. The projects themselves are invented; the photographs do not show the buildings described.

The font is Archivo Variable, via `@fontsource-variable/archivo`, under the SIL Open Font License 1.1.

The logo is redrawn as vector shapes from the studio's PNG mark, so it stays sharp at any size: `LogoMark` in `components/icons.tsx` (header and footer) and `public/favicon.svg` (the browser tab) hold the same shapes.

## Testing

`npm test` runs Vitest over the pure logic: `lib/geo.ts` (coordinate maths, focus orientation, grouping), `lib/countries.ts` (decoding the real outlines, finding each project's and office's country, rings across the antimeridian, holes, segment building), `globe/GlobeController.ts` (damping, focus, shortest yaw path, drag inertia, the close-up zoom, reduced motion), `hooks/useSiteRoute.ts` (reading and writing every kind of address), `lib/contactForm.ts` (the form's checks), `data/contactSource.ts` (that it reports not being connected) and sanity checks on `data/demoProjects.ts`, including that every referenced photograph exists under `public/`, has alt text and a credit, and is used only once. Test files live next to the code as `*.test.ts` and are type-checked by `tsconfig.test.json`.

## Known limitations

- Projects are local demonstration data; there is no API behind `fetchProjects()` yet.
- The contact form is not connected to a server yet (`sendContactMessage()` in `data/contactSource.ts`), and the contact details, social links and services are placeholders (`data/site.ts`, `data/offices.ts`).
- The Google maps load as soon as the Contact page opens, which sets Google's cookies; a cookie notice may be needed where the law requires one.
- The sun is fixed relative to the camera, so the lit face is a stylised look, not the real time of day.
- The production bundle is a single JavaScript chunk, mostly three.js and React Three Fiber, and Vite warns about its size. Loading the globe lazily would split it.
- The 3D view needs WebGL 2. Without it, only the strip, captions and project pages are available.
- If the graphics driver drops the WebGL context, the page shows a notice and needs a reload.
- While the ripples play, the globe renders every frame; it stops when motion is paused or the globe is scrolled out of view.
