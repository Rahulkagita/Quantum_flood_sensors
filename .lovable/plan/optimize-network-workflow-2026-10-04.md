# Optimize Network Workflow

## Goal
Add a fast, full-width optimization sequence launched from either existing optimization action, then transition the live map and dashboard into the completed mock network state.

## Experience
- Show seven timed stages in a restrained overlay over the map: risk analysis, candidate generation, coverage matrix, QUBO formulation, QAOA run, network evaluation, and completion.
- Keep the map visible behind the overlay and synchronize map effects with the current stage.
- Include a persistent “Skip animation” control; total automatic runtime will target roughly 7 seconds.
- After completion, dismiss the overlay, reveal selected sensors in sequence, expand coverage rings, draw communication links, and count coverage through 54 → 67 → 78 → 85 → 91.4%.
- Show an “OPTIMIZED NETWORK · 91.4% RISK COVERAGE” result and a “View Optimization Details” action.
- Update the below-map before/after and optimization sections only after a completed run.

## Technical details
- Add a dedicated frontend optimization service with typed stage events, request/result models, cancellation, and a mock implementation shaped for a future `POST /api/optimization` adapter.
- Add an optimization workflow component for stage-specific visuals, including matrix, QUBO terms, circuit-inspired QAOA graphics, and quantum/classical comparison without fabricated measurements.
- Extend the SVG map with explicit workflow presentation state for candidate appearance/removal, sequential optimized-node reveal, coverage expansion, and animated network links.
- Keep the route responsible only for shared basin, workflow, coverage, selection, and result state; preserve map-internal navigation and layer controls.
- Respect reduced-motion preferences by shortening the sequence and retaining the skip path.
- Validate desktop and mobile interaction, visual transitions, and the current preview build.
