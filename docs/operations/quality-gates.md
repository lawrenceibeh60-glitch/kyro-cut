# Quality gates

A subsystem is complete only after relevant checks are executed.

- **Schema:** malformed documents rejected; valid documents serialize/parse round-trip.
- **Timing:** integer-frame conversion and boundaries tested.
- **Animation:** unsorted keys, hold/linear interpolation and keyframe replacement tested.
- **Editing:** commands preserve state and undo/redo restore expected values.
- **Media:** stable asset IDs, metadata and relink paths required before production import.
- **Rendering:** preview/export evaluation semantics match and failures are surfaced.
- **API:** health and project validation have automated tests.
- **Delivery:** export settings, cancellation, progress and output integrity verified.
- **Integration:** production build, API tests and browser smoke tests pass.

Never report a check as passed unless it was actually executed.
