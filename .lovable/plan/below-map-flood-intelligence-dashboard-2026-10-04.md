# Below-map flood intelligence dashboard

## Outcome

Extend the existing landing page with a continuous dark operational workspace beneath the map. Preserve the first viewport and its interactions while adding concise analytical sections, synchronized network comparisons, a mock-only optimization narrative, and a professional optimized-sensor inspector.

## Build

- Add typed mock forecast, zone-risk, network, impact, optimization, and sensor-detail data behind the existing `FloodIntelligenceService` boundary.
- Convert the landing shell from a locked viewport into a full page while keeping the map experience exactly one viewport tall.
- Build the current-situation strip, selectable 6/12/24/48-hour forecast chart with legends and tooltips, and restrained risk analytics.
- Add sensor-network metrics and a compact node-link visualization.
- Add synchronized current/optimized mini maps with animated comparison values.
- Add the clearly labeled mock quantum optimization process and impact metrics.
- Open a right-side operational inspector when an optimized sensor is selected from either map experience.
- Match existing semantic colors, typography, dividers, and square technical geometry; avoid a generic card grid.

## Technical details

- Use the installed Recharts and Motion libraries; no backend calls or persistence.
- Keep the main SVG map self-contained and expose optimized-sensor selection through the existing callback only.
- Use shared mock data for charts, comparisons, and inspector values so basin changes remain coherent.
- Validate desktop and mobile layouts, chart controls/tooltips, optimized selection, and current preview health.
