# System overview

## Runtime boundaries
The browser studio owns interaction and local preview. Shared TypeScript packages define the canonical project format, timebase, property evaluation and reversible command history. Engine packages must not import React or Flask route handlers. The Flask API validates documents and coordinates server-side services; it must not be called for each preview frame.

## Canonical project
A `.kcut` project is versioned JSON with a stable project ID, compositions, frame-rate and duration metadata, layers, and animatable properties. Parsing is a validation boundary: invalid documents are rejected with path-addressed issues. Future migrations must be explicit and tested.

## Time model
Timeline positions are integer frame indices. Seconds are derived from frame index and composition frame rate; floating-point seconds are not the source of truth for keyframe placement.

## Animation evaluation
Keyframes are sorted by frame during evaluation. Values before the first key use the property's base value; values between keys use the left key's interpolation mode; values after the final key hold the last value. Evaluation is deterministic for the same document and frame.

## Rendering
The current viewport uses Canvas 2D to establish the project/animation contract. This is an initial renderer, not the final GPU compositor. The architecture will evolve toward WebGL/WebGPU and a dependency-aware render graph.

## Persistence and cloud
Portable export/import currently uses the `.kcut` document. IndexedDB recovery, asset relinking, revision snapshots, sync conflict resolution, remote render jobs and durable media storage remain future implementation work and are not represented as shipped features.
