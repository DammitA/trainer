<!--
SPDX-FileCopyrightText: 2026 Alexander Doner
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Target Training App

`Target Training App` is a single-page browser tool for visual target drills. It combines configurable target shapes, timer beeps, classifier layouts, continuous moving targets, swinger motion, presets, and screen calibration.

It is designed for local use: open the page in a modern browser, adjust settings, and start training. No build step, server, or external dependencies are required.

## Features

- Four modes: `Timed board`, `Classifier`, `Continuous flow`, and `Swinger`
- Three timer styles for timed board drills: `Single Par Time`, `Reload separated par`, and `Shot Defined Par`
- Built-in default presets plus user presets stored in browser `localStorage`
- CSV preset import and export
- Target shapes: circle, square, NRA D1, USPSA, IPSC Mini, and bowling pin
- Fixed target sizing, randomized target sizing, or calibrated distance-based sizing for dimensioned targets
- Optional numbered targets, bright color cycling, black background, grid layout, and hide-until-start behavior
- Classifier layouts with fixed target/no-shoot geometry
- Continuous target flow with configurable spawn edges, speed, density, and stop behavior
- Swinger mode with optional Activated timing, side activator targets, axis marker, and hard cover
- Screen calibration with a credit-card reference rectangle
- Keyboard shortcuts for start/stop and settings visibility

## Files

- [index.html](/home/alex/Documents/Shooting/dammit/usr/share/html/dammit_org/trainer/index.html): application markup, styles, and main wiring
- [js/](/home/alex/Documents/Shooting/dammit/usr/share/html/dammit_org/trainer/js): app modules for settings, presets, audio, targets, motion, timer mode, continuous mode, swinger mode, and UI bindings

## Getting Started

1. Open `index.html` in a modern desktop browser.
2. Use `Help` for an in-page overview of modes and shortcuts.
3. Optionally press `Calibrate Screen` and match the rectangle to a credit card.
4. Pick a mode or preset.
5. Tune the visible settings.
6. Press `Start`, or press the space bar.

The app is entirely client-side.

## Keyboard Controls

- `Space`: starts or stops the active drill, including timers, continuous flow, normal Swinger, and Activated Swinger timing
- `Esc`: hides or shows the settings pane

Starting a drill does not automatically hide the settings pane. Use `Hide` or `Esc` when you want the board unobstructed.

## Modes

### Timed Board

Timed board renders a static set of targets and runs a beep-defined drill. The timer mode selector controls the drill structure:

- `Single Par Time`: random start delay, start beep, one engagement window, stop beep
- `Reload separated par`: random start delay followed by repeated engagement windows separated by reload time
- `Shot Defined Par`: random start delay, first shot time, shots per string, split time, reload count, and reload time

If `Hide until start beep` is enabled, targets stay hidden until the start beep.

### Classifier

Classifier mode renders a fixed drill layout from the selected course brief. It supports fixed target and no-shoot geometry, and uses the same timer modes as Timed Board.

Useful controls include:

- `Classifier`
- `Target center height`
- distance scaling controls
- beep/timer settings

### Continuous Flow

Continuous flow creates moving targets from configurable board edges. It supports edge selection, randomized or ordered start positions, opposite-edge alternation, flow speed, creation rate, and optional stopwatch behavior.

Useful controls include:

- `Spawn source`
- `Start positions`
- `Alternate opposite edge`
- `Bypass stopwatch`
- `Stop after seconds` or `Stop after targets`
- `Flow speed (px/s)`
- `Creation rate (targets/s)`

### Swinger

Swinger mode animates a single target around a configurable pivot. Normal Swinger starts moving immediately and continues until `Stop` or the space bar.

Useful controls include:

- `Swing rate (deg/s)`
- `Target height (px)` or target-distance-based swing dimensions
- `Axis height (px)` or target-distance-based axis height
- `Show axis point`

#### Activated Swinger

`Activated` adds a timing sequence and two side activator targets. The swinger starts held down to the selected side, then releases after the configured cue sequence:

1. Random start delay counts down.
2. Start beep sounds.
3. Draw time runs, if nonzero.
4. Draw-time cue beep sounds, if draw time is nonzero.
5. Activator delay runs.
6. Swinger begins moving and continues until stopped.

Activated controls include:

- start lean: left or right
- random start min/max
- draw time
- activator delay
- side target shape, size, color for circle/square, vertical offset, and left/right X positions

Side activator targets render above hard cover.

#### Hard Cover

`Hard cover` adds solid wall-style cover over the Swinger board. Enable the master toggle, then enable bottom, left, and/or right cover independently.

Controls include:

- wall color
- wall opacity
- bottom coverage percent
- left coverage percent
- right coverage percent

Overlapping hard-cover regions stay at the selected opacity instead of becoming darker.

## Presets

Presets store the current Trainer settings. The app includes default presets, and users may delete them like any other preset. If a deleted default preset is later imported, it becomes available again.

Preset actions:

- `Save Preset`: saves the current settings under a chosen name
- `Delete Preset`: removes the selected preset
- `Export`: downloads all current presets as CSV
- `Import`: imports presets from CSV and merges them into the current preset list

The CSV format is:

```csv
name,preset_json
"Classic Bowling Pins","{...}"
```

`preset_json` is the normalized settings object used by the app. Imported presets with the same name overwrite the local preset of that name.

## Screen Calibration

`Calibrate Screen` opens a credit-card-sized reference rectangle. Adjust the rectangle height until a physical credit card matches it, then press `Confirm`. The app saves the resulting `px/in` value in browser `localStorage`.

The calibration button also acts as a status indicator:

- red text and `uncalibrated` means no screen calibration is saved
- green text and `calibration XX px/in` means distance sizing is available

Calibration is specific to the current browser, display, zoom level, and operating system scaling. Recalibrate if any of those change.

## Distance Sizing

When calibration exists and the selected target has known real dimensions, the Target Board panel can switch from pixel sizing to distance-based sizing.

The app uses:

```text
display height = real target height * distance from screen / simulated target distance
```

The same scale applies to width. `Distance from screen` is entered in feet, and `Desired target distance` is entered in yards. IPSC Mini dimensions are converted from centimeters; NRA D1, USPSA, and bowling pin dimensions use inch-based source dimensions.

Large targets are allowed to clip at the board edges.

## Persistence

The app stores these values in browser `localStorage`:

- last-used settings
- user presets
- default preset deletion markers
- screen calibration

This means settings are local to one browser profile. Clearing site storage removes them.

## Audio Notes

The beeps use the browser Web Audio API. Browsers may require a user interaction before audio can play, so use the test beep buttons if cues are not audible.

## Limitations

- This is a static browser app, not a packaged application
- Presets and calibration are local to one browser profile unless exported
- There is no scoring, hit detection, or session logging
- Continuous flow does not avoid collisions between moving targets
- SVG target art is functional but may be refined after user feedback
