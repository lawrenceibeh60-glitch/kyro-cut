# KYRO CUT

KYRO CUT is a browser-first creative studio being built for professional motion graphics, anime-style compositing, video editing, color, audio, and delivery.

## Current foundation
- React + TypeScript studio shell with an interactive Canvas 2D composition preview, editable text layers, transforms, and keyframes.
- Composition and multitrack Edit workspaces with clip split, right-trim, ripple-delete, and snapping engine primitives.
- Portable, versioned `.kcut` JSON project format with validation, serialization, import and export.
- IndexedDB local autosave/recovery with a localStorage fallback.
- Undo/redo command history and Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z shortcuts.
- Extensible effect registry with adjustable glow, radial speed lines, motion trails, and pulsing impact rings.
- Browser WebM preview recording; this captures the visual preview only and does not include an audio mix.
- Editable circle, ring, rectangle, diamond, and line vector geometry plus text layers.
- Local image, video, and audio import backed by IndexedDB media blobs; images/videos render in the composition viewer and audio/video follow the transport.
- Integer-frame timebase and deterministic hold/linear keyframe evaluation.
- Reversible command history with undo/redo semantics.
- Flask API health endpoint and project validation endpoint.
- Automated TypeScript and Python tests plus GitHub Actions CI.
- Render Blueprint for separate static studio and Flask API services.

## Architecture principles
1. One canonical project document and explicit schema versions.
2. One integer-frame timebase shared by animation and timeline systems.
3. One animatable-property evaluation contract.
4. Reversible, validated editing commands.
5. Preview and final export must share evaluation semantics.
6. Local-first projects; cloud sync and remote rendering remain optional.
7. Engine packages must not depend on React components or Flask route handlers.
8. Never call a feature complete before it has been tested.

## Development
Requirements: Node.js 20+, pnpm 9+, Python 3.11+.

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

Run the API locally:

```bash
python -m pip install -e ".[dev]"
flask --app backend.api.app run
pytest
```

## Honest status
The current preview is an initial Canvas 2D implementation. A production GPU render graph, full video/audio decoding and export, indexed local recovery, media relinking, node compositing, tracking, color scopes, remote rendering and cloud sync are not yet implemented. They remain part of the engineering scope rather than being represented as shipped.
