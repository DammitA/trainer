# Target Training App

`Target Training App` is a single-page browser tool for visual target drills. It combines configurable target shapes, timer beeps, continuous moving targets, swinger motion, presets, and screen calibration in one self-contained `index.html` file.

It is designed for local use: open the page in a modern browser, adjust settings, and start training. No build step, server, or external dependencies are required.

## Features

- Three modes: `Timed board`, `Continuous flow`, and `Swinger`
- Three timer styles for timed board drills: `Single Par Time`, `Reload separated par`, and `Shot Defined Par`
- Built-in default presets plus user presets stored in browser `localStorage`
- CSV preset import and export
- Target shapes: circle, square, NRA D1, USPSA, IPSC Mini, and bowling pin
- Fixed target sizing, randomized target sizing, or calibrated distance-based sizing for dimensioned targets
- Optional numbered targets, bright color cycling, black background, grid layout, and hide-until-start behavior
- Screen calibration with a credit-card reference rectangle
- Keyboard shortcuts for start/stop and settings visibility

## Files

- [index.html](/home/alex/Documents/Shooting/dammit/usr/share/html/dammit_org/trainer/index.html): complete application, including markup, styles, and JavaScript

## Getting Started

1. Open `index.html` in a modern desktop browser.
2. Use `Help` for an in-page overview of modes and shortcuts.
3. Optionally press `Calibrate Screen` and match the rectangle to a credit card.
4. Pick a mode or preset.
5. Tune the visible settings.
6. Press `Start`, or press the space bar.

The app is entirely client-side.

## Keyboard Controls

- `Space`: starts or stops the active drill, including timers, continuous flow, and swinger motion
- `Esc`: hides or shows the settings pane

Starting a drill does not automatically hide the settings pane. Use `Hide` or `Esc` when you want the board unobstructed.

## Modes

### Timed Board

Timed board renders a static set of targets and runs a beep-defined drill. The timer mode selector controls the drill structure:

- `Single Par Time`: random start delay, start beep, one engagement window, stop beep
- `Reload separated par`: random start delay followed by repeated engagement windows separated by reload time
- `Shot Defined Par`: random start delay, first shot time, shots per string, split time, reload count, and reload time

If `Hide until start beep` is enabled, targets stay hidden until the start beep.

### Continuous Flow

Continuous flow ignores the timer panel and creates moving targets until stopped. It supports direction, edge behavior, flow speed, and creation rate.

Useful controls include:

- `Spawn source`
- `Start positions`
- `Alternate opposite edge`
- `Flow speed (px/s)`
- `Creation rate (targets/s)`

### Swinger

Swinger mode ignores the timer panel and animates a single target around a configurable pivot. Space bar, `Start`, and `Stop` pause and resume the same motion state.

Useful controls include:

- swing width
- swing height
- axis height
- period
- angle range

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

- This is a single-file browser app, not a packaged application
- Presets and calibration are local to one browser profile unless exported
- There is no scoring, hit detection, or session logging
- Continuous flow does not avoid collisions between moving targets
- SVG target art is functional but may be refined after user feedback
