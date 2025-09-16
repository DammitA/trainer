# Target Training App

This project hosts a browser-based training app tailor-made for dry-fire or live-fire practice. It runs entirely client-side and is designed to be deployed to GitHub Pages or any static host.

## Features

- **Configurable timing** – Randomized start cue between min/max bounds, fixed work window, and independent start/stop beep tuning.
- **Reliable audio** – Web Audio API with priming to avoid missed tones on desktop/mobile browsers. Test buttons let you confirm tones before a run.
- **Full-screen drill board** – Targets fill the viewport; settings collapse into an off-canvas drawer to keep your board unobstructed.
- **Flexible targets** – Pick circle or square shapes, choose quantity, color, numbering, fixed or random sizing, and shuffle numbers in grid mode. Toggle between random placement (with light overlap avoidance) or grid layout.
- **Run visibility controls** – Optionally hide targets until the start beep for surprise drills.
- **Preset & persistence** – All settings persist automatically in `localStorage`, with named presets for quick recall across sessions.

## Getting Started

1. Open `index_targets.html` locally or host it from a static server. For GitHub Pages, place this repository on a branch named `gh-pages`.
2. Click anywhere (or use the Start button) to prime audio if your browser blocks autoplay.
3. Adjust settings, then hit **Start** or tap `Space` to arm/stop the drill.
4. Use the Presets panel to save any configuration you want to revisit later.

## Browser Notes

- The app relies on the Web Audio API; ensure autoplay is permitted or interact once to unlock audio.
- Settings and presets are stored locally on the device via `localStorage`; clearing site data resets them.
- For touch devices, the off-canvas settings work best in landscape mode, but the board still scales to portrait.

## Developing / Contributing

- All logic lives in `index_targets.html` with inline CSS/JS for portability.
- No build step is required—edit and refresh.
- If you add new configurable fields, remember to hook them into `currentSettings`, `applySettings`, persistence, and presets.

Enjoy your training!
