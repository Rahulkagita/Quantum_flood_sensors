<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep flood-domain data behind the `FloodIntelligenceService` interface so future REST APIs can replace mocks without redesigning UI.
- Render the hero map with MapLibre using basemaps from `src/lib/map-config.ts` (BasemapProvider → MapStyle) and mock GeoJSON in `src/lib/geo-data.ts`, so production tile providers and backend geospatial layers can be swapped in without rewriting the map component.
- Keep map interaction state inside the map experience and expose only basin, selection, focus, and optimization state to the landing route, so future map providers remain replaceable.
- Keep below-map analytics as one continuous operational workspace fed by shared basin dashboard mocks, so charts, comparisons, and sensor inspection stay synchronized.
- Run optimization through `OptimizationWorkflowService` (request → stage events → result) with user-supplied `OptimizationConfig`; UI reads all optimization numbers from the returned result, never constants, so a POST /api/optimization adapter can replace the deterministic mock.
- Run flood scenarios through a typed service and share only completed scenario results with the map, so a future REST adapter can replace mock projections without coupling controls to geography rendering.
- Lay out map overlays (risk panel, control rail, legend\/status) in one CSS grid HUD so controls can never overlap; use cooperative gestures so the page owns wheel scrolling.
- App chrome lives in `AppSidebar` (slim rail on desktop, bottom nav on mobile) with nav items scrolling to section ids on the single landing route, so the document always owns scrolling.
- Theme is class-based (`.dark` on <html>) via `src/lib/theme.tsx` with a pre-paint boot script; all colors come from semantic tokens in `src/styles.css`, and the map's Dark/Light basemaps follow the resolved theme.
- Alerts run through `AlertService` in `src/lib/alerts-service.ts`; email/WhatsApp channels are UI-only until a backend exists.
