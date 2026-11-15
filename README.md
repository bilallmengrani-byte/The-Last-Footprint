# The Last Footprint — Abandoned but Not Forgotten

A cinematic, interactive space-history archive about spacecraft that have fallen silent but remain part of humanity's exploration of the Moon, Mars, and deep space. Mission records are curated from NASA and the NASA Space Science Data Coordinated Archive (NSSDCA); unverified metrics are marked in the app.

## Explore

- Visit six spacecraft artifacts across three destinations: Apollo 11's Eagle descent stage, the Apollo 15 Lunar Roving Vehicle, Sojourner, Opportunity, Ingenuity, and Pioneer 10.
- Inspect the 3D scene, spacecraft hotspots, mission stories, timelines, and source citations.
- Try the signal-alignment activities, mission-specific engineering simulations, and Flight Director decisions.
- Switch to 2D Archive Mode from the navigation bar if you prefer the schematic archive view or need to continue without the 3D scene.
- Discovery progress is saved in this browser's local storage. Clearing this site's browser data resets it.

## Run locally

The project uses Bun (a `bun.lock` lockfile is included) and Vite.

```sh
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). A modern browser with WebGL support is recommended for the 3D scene; 2D Archive Mode remains available from the app navigation.

## Project commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the Vite development server on port 3000 |
| `bun run lint` | Run the TypeScript check (`tsc --noEmit`) |
| `bun run build` | Create the production build in `dist/` |
| `bun run preview` | Preview the production build locally |

No environment variables or API keys are required for the current app. `DISABLE_HMR=true` can be set to disable Vite HMR and file watching.

## Project structure

- `src/App.tsx` — application views, navigation, and locally saved progress
- `src/data/missions.ts` — destinations, mission records, activities, and citations
- `src/components/` — archive panels, mission dossier, and interactive simulations
- `src/three/` — Three.js scenes, spacecraft reconstructions, textures, and shaders
- `src/audio/soundEngine.ts` — procedural interface and ambient audio
- `public/assets/planets/` — planetary texture assets

## Sources and attribution

Use the **About & Sources** panel in the app for mission-data provenance, image credits, and links to NASA, NSSDCA, and other source material. The panel identifies Solar System Scope planetary textures as CC BY 4.0; follow the applicable upstream attribution and license terms when reusing assets. This repository does not include a project-wide `LICENSE` file.
