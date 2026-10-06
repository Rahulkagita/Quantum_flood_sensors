# Flood intelligence workspace

## Build
- Replace the blank page with a map-first emergency operations workspace focused on Krishna and Godavari basins.
- Add a compact command header, basin and area selectors, live scenario controls, a risk legend, operational telemetry, and clear sensor/relay/recommended-location markers.
- Make optimization a transparent mock workflow: configurable resources, visible processing state, and a before/after impact comparison without claiming real quantum output.
- Add responsive layouts so the map remains primary on desktop and the controls remain usable on smaller screens.

## Frontend architecture
- Keep the existing TanStack Start foundation while delivering the requested React, TypeScript, Tailwind, shadcn/ui-style component system; the project does not support switching to Next.js.
- Create typed domain models, realistic mock responses, and a service interface matching the future REST endpoints without implementing any backend.
- Use a self-contained interactive geospatial canvas for reliable independent operation, with pan/zoom and selectable network markers.
- Centralize colors, typography, shadows, and motion in the design system; add accessible labels and reduced-motion handling.

## Validation
- Verify the full scenario-to-optimization interaction in the live preview.
- Check desktop and mobile layouts, metadata, build health, and critical controls.
