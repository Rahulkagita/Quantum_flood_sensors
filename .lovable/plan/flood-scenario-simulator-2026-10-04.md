# Flood Scenario Simulator

## Goal

Add a compact simulator to the existing operational dashboard without changing the landing page. Users can configure worsening flood conditions, run a short mock simulation, compare current and projected requirements, and see newly critical zones on the main map.

## Implementation

- Add a typed scenario service abstraction with request, result, recommendation, and critical-zone models shaped for a future `POST /api/scenario` adapter.
- Provide deterministic mock results based on basin, rainfall intensity, river rise, duration, sensor failures, and communication-node failures.
- Add a dashboard section with compact controls, a clear simulate action, loading state, current-versus-predicted metrics, and recommended response actions.
- Lift only the completed scenario result to the landing route so the existing shared map can visualize it.
- Highlight newly critical zones on the map with restrained animated risk contours and a scenario status legend, while preserving map controls and optimization state.
- Reset scenario output when the basin changes and clearly label all scenario output as mock data.

## Validation

- Exercise parameter changes and simulation on desktop and mobile.
- Verify results, recommendations, and critical-zone map highlights update together.
- Check the latest build and runtime diagnostics.

## Technical details

- Keep scenario calculations behind a `FloodScenarioService` interface.
- No endpoint, persistence, real forecast model, or backend will be added.
- Preserve reduced-motion behavior and existing semantic design tokens.
