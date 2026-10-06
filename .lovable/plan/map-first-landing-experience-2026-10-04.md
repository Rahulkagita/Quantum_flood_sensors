# Map-first landing experience

## Scope
- Replace the current multi-panel workspace with one polished, full-viewport map command center.
- Default to the Krishna basin and keep all data visibly mock-based.
- Preserve the existing frontend-only flood service boundary and self-contained SVG map architecture.

## Experience
- Add a minimal floating identity/header with basin, area, feed status, and live state.
- Make the operational map occupy the entire first viewport, with smooth pan/zoom, location selection, basin focus transitions, and compact responsive controls.
- Add compact basemap and layer menus covering all requested map modes and analytical layers.
- Render smooth flood-risk fields, rivers, existing/candidate/optimized sensors, relays, coverage radii, and animated network paths.
- Add the Krishna risk briefing, primary actions, and bottom KPI strip as restrained overlays.
- On mobile, keep the map primary and move controls into compact bottom sheets/popovers.

## Technical details
- Use React state and SVG transforms for offline-safe map interactions; no backend or real map/API calls.
- Use the existing Button, Select, Popover, and Sheet components for controls.
- Add Motion for React for subtle entrance, location, marker, coverage, and KPI transitions.
- Keep risk, network, and location data typed behind `FloodIntelligenceService`.
- Validate compilation plus desktop and mobile interaction/rendering.
