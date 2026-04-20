# Target Training App

`Target Training App` is a single-page browser tool for visual drills. It combines configurable targets, audio start/stop cues, and a continuous moving-target mode in one self-contained `index.html` file.

It is designed for quick local use: open the page in a browser, adjust settings, and start training. No build step, server, or external dependencies are required.

## Features

- Timed board mode with randomized start delay and configurable work duration
- Continuous flow mode with moving targets that spawn until stopped
- Configurable start and stop beeps with test buttons
- Circular or square targets
- Fixed target color or rotating bright color palette
- White or black board background
- Fixed-size or randomized-size targets
- Random or grid target layout in board mode
- Optional numbered targets
- Optional hide-until-start behavior in timed mode
- Presets saved locally in the browser
- Last-used settings restored automatically on the same device
- Keyboard shortcut support for start/stop

## Files

- [index.html](/home/alex/Documents/Shooting/trainer/index.html): complete application, including markup, styles, and JavaScript

## Getting Started

1. Open `index.html` in a modern desktop browser.
2. Allow audio playback if the browser prompts or blocks sound.
3. Configure the session mode and target options.
4. Press `Start`.
5. Press `Stop` at any time, or let timed mode finish automatically.

There is no installation step. The app is entirely client-side.

## How It Works

The app has two session modes:

### Timed Board

In `Timed board`, a static set of targets is rendered on the board. When you start a run:

1. The app chooses a random delay between `Random start delay` min and max.
2. A start beep is played at the chosen time.
3. The run stays active for the configured `Work window after start`.
4. A stop beep is played at the end.
5. The run resets automatically.

If `Hide until start beep` is enabled, the targets remain hidden until the start beep fires.

### Continuous Flow

In `Continuous flow`, the timer panel is ignored. The app continuously creates targets and moves them across the board until you press `Stop`.

Continuous mode uses:

- `Spawn source`
- `Start positions`
- `Alternate opposite edge`
- `Flow speed`
- `Creation rate`

## Controls

### Presets

- `Load preset`: loads a previously saved configuration
- `Save Preset`: stores the current settings under a chosen name
- `Delete Preset`: removes the selected preset

Presets are stored in browser `localStorage`, not on disk as separate files.

### Mode

- `Timed board`: static board with beeps and a finite run
- `Continuous flow`: moving targets with no timer

### Timing & Beeps

These controls apply to `Timed board` mode:

- `Random start delay (s)`: minimum and maximum delay before the start beep
- `Work window after start (s)`: active drill duration after the start beep
- `Start beep frequency (Hz)`: pitch of the start cue
- `Start beep length (s)`: duration of the start cue
- `Stop beep frequency (Hz)`: pitch of the stop cue
- `Stop beep length (s)`: duration of the stop cue
- `Test start beep`: preview the configured start cue
- `Test stop beep`: preview the configured stop cue

### Target Board

These controls define how targets look and how static boards are built:

- `Number of targets`: count of targets in timed board mode
- `Shape`: `Circle` or `Square`
- `Target color`: base color when palette cycling is off
- `Arrangement`: `Random placement` or `Grid layout`
- `Number targets`: overlays numeric labels
- `Cycle bright colors`: rotates targets through a built-in bright color palette instead of using one fixed color
- `Black background`: switches the training board from white to black
- `Randomize size`: enables target size sampling within a range
- `Hide until start beep`: timed mode only; hides targets until the run begins
- `Target size (px)`: fixed size when random sizing is off
- `Min size (px)` and `Max size (px)`: size range when random sizing is on

### Continuous Flow

These controls apply to `Continuous flow` mode:

- `Spawn source`
- `Start positions`
- `Alternate opposite edge`
- `Flow speed (px/s)`
- `Creation rate (targets/s)`

#### Spawn Source

Options:

- `Left to right`
- `Right to left`
- `Top to bottom`
- `Bottom to top`
- `Around border`

For the single-edge options, targets enter from the chosen side and move straight across the board.

For `Around border`, targets spawn from points around the full perimeter and travel toward the point mirrored across the center of the board. Examples:

- bottom-left corner travels toward top-right
- bottom-center travels toward top-center
- left-center travels toward right-center

#### Start Positions

Options:

- `Random along edge`
- `Ordered sequence`

Behavior depends on `Spawn source`:

- For single-edge spawns, `Random` selects random offsets along the edge.
- For single-edge spawns, `Ordered` walks through offsets in sequence.
- For border spawns, `Random` selects random points around the perimeter.
- For border spawns, `Ordered` walks around the perimeter in sequence.

#### Alternate Opposite Edge

This toggle affects continuous spawning differently depending on the selected source:

- With a single edge selected, targets alternate between the chosen edge and its opposite.
  Example: `Left to right` alternates `left`, `right`, `left`, `right`.
- With `Ordered sequence` plus `Around border`, spawns occur in paired positions that are roughly half a perimeter apart, so adjacent targets appear nearly 180 degrees apart while the sequence still advances around the screen.
- With `Random along edge` plus `Around border`, the toggle does not create a paired perimeter sequence; border spawning remains random.

#### Flow Speed

`Flow speed (px/s)` controls target velocity magnitude.

- Higher values make targets cross the board faster.
- In border mode, the speed is applied along the computed diagonal or mirrored trajectory.

#### Creation Rate

`Creation rate (targets/s)` controls how many moving targets are generated over time.

The app accumulates elapsed time and spawns new targets at the configured rate while the continuous run is active.

## Status Display

The status panel shows:

- `Status`: current app state such as `Idle`, `Waiting for start beep…`, `Run active`, `Continuous flow active`, `Stopped`, or `Completed`
- `Start in`: countdown to the timed start cue
- `Stop in`: countdown to the timed stop cue
- `Selected delay`: the exact randomized delay chosen for the current timed run

In continuous mode, the countdown fields are not used.

## Runtime Behavior

### Start / Stop Buttons

- `Start`: starts either the timed run or the continuous flow run, depending on the selected mode
- `Stop`: stops the current run immediately
- `Show settings` / `Hide settings`: collapses or expands the settings pane

When a run starts, the settings pane auto-collapses to maximize board space.

### Keyboard Shortcut

- `Space`: toggles start/stop

This works even when the settings panel is hidden.

## Persistence

The app stores data in browser `localStorage`:

- last-used settings
- saved presets

That means:

- settings persist across page reloads on the same browser/profile
- presets are local to the device/browser profile
- clearing site storage removes saved state

## Rendering Details

### Board Mode Layout

Timed board mode supports two layout strategies:

- `Random placement`: the app samples candidate positions and favors placements with lower overlap penalty
- `Grid layout`: the app computes rows and columns from board aspect ratio, then fits targets inside cells

### Target Sizing

When `Randomize size` is enabled:

- each target samples a size between `Min size` and `Max size`
- the app normalizes the range if the values are entered in reverse

### Target Colors

When `Cycle bright colors` is enabled, targets rotate through a predefined bright palette instead of using the color picker value.

The palette is applied consistently in:

- timed board rendering
- continuous moving-target creation

### Text Contrast

The app computes a contrasting text color for numbered targets based on the target fill color so labels remain readable.

## Audio Notes

The beeps are generated with the browser Web Audio API.

Practical implications:

- the browser may require a user interaction before audio can play
- the `Test start beep` and `Test stop beep` buttons are useful for confirming audio access
- if the browser is muted or blocked from autoplay/audio output, cues may not be audible

## Limitations

- This is a single-file browser app, not a packaged application
- Presets are local to one browser profile
- There is no export/import for presets yet
- There is no scoring, hit detection, or session logging
- Continuous mode does not currently avoid collisions between moving targets
- Border-mode alternating logic is specifically implemented for the ordered perimeter sequence

## Customization Notes

Because the project is a single `index.html` file, the easiest ways to extend it are:

- add new controls in the settings panels
- extend `currentSettings()` and `applySettings()` for persistence
- update rendering helpers for new target behaviors
- adjust CSS variables and board classes for theme work

## Suggested Usage Patterns

### Reaction Drill

- Mode: `Timed board`
- Delay: `1.0` to `3.0`
- Work window: `3` to `6` seconds
- Hide until start beep: enabled
- Numbered targets: enabled

### Target Identification Drill

- Mode: `Timed board`
- Grid layout
- Numbered targets enabled
- Black background enabled
- Fixed size targets

### Tracking Drill

- Mode: `Continuous flow`
- Spawn source: `Around border`
- Start positions: `Ordered sequence`
- Alternate opposite edge: enabled
- Moderate flow speed
- Low to medium creation rate

### Chaos Scan Drill

- Mode: `Continuous flow`
- Spawn source: `Around border`
- Start positions: `Random along edge`
- Cycle bright colors: enabled
- Randomize size: enabled

## Browser Compatibility

The app targets modern browsers with support for:

- `requestAnimationFrame`
- `localStorage`
- Web Audio API
- standard DOM APIs

Recent Chrome, Edge, Firefox, and Safari versions should work.

## Development

There is no build tooling in this directory. To modify the app:

1. Edit [index.html](/home/alex/Documents/Shooting/trainer/index.html)
2. Reload the page in the browser
3. Test both `Timed board` and `Continuous flow`
4. Verify saved settings and presets still load correctly

## Summary

This page is a lightweight, configurable target-training tool with two main workflows:

- a timed, beep-driven static board
- an endless moving-target flow system

It is intentionally simple to run and simple to modify, while still supporting a fairly broad set of drill patterns through the combinations of layout, timing, color, size, and spawn controls.
