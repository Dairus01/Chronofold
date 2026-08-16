# Chronofold architecture

This document describes the active release implementation. An earlier authored prototype was removed during repository cleanup because its disabled scene hierarchy and assets were no longer used by the Lens.

## Runtime composition

The saved scene provides the tracking, camera, lighting, and two Chronofold script hosts. The dashboard itself is generated at runtime.

```text
Scene
|-- Lighting
|-- SpectaclesInteractionKit
|   |-- Configuration
|   |-- LeftHandInteractor
|   |-- RightHandInteractor
|   |-- HandVisuals
|   |-- MobileInteractor
|   `-- MouseInteractor
|-- Chronofold App
|   `-- ChronofoldMain
|-- Chronofold Canvas View Rig
|   |-- Camera Object
|   `-- Chronofold Dashboard
|       `-- ChronofoldDashboardUI
`-- AiPreviewAgent Handler
```

`Chronofold App` is the model and controller host. `Chronofold Dashboard` is positioned on the canvas view rig and is the root for generated UI.

## Source files

### `ChronofoldSceneContracts.ts`

This module defines the data shared by the controller and view:

- `ChronofoldLane`: `today`, `overflow`, or `tomorrow`
- `ChronofoldTask`: stable task identity, display label, duration, lane, icon, palette, and layout hint
- `INITIAL_TASKS`: the sample schedule loaded at startup
- `taskDurationSeconds`: compatibility helper for minute-based and second-based task durations
- authored scene object names used during wiring

### `ChronofoldMain.ts`

This component owns application state and behavior:

- the mutable task collection
- day capacity
- action workflow state
- pending text and duration input
- selected task identity
- timer state
- task mutation rules
- state totals and status output
- grab and drop audio playback
- deterministic Preview self-tests

The controller subscribes to public events exposed by the dashboard. After a state change, it sends a fresh render model back to the dashboard. The view does not decide scheduling rules.

### `ChronofoldDashboardUI.ts`

This component owns presentation and interaction adapters:

- runtime UIKit panel construction
- task-card geometry and colors
- action buttons and capacity control
- workflow prompts
- text and numeric keyboard requests
- Today and overflow card stacks
- status and timer presentation
- left-hand and right-hand pinch tracking
- Preview mouse and touch dragging
- task-card rebuild and cleanup

## State flow

```text
User input
   |
   v
ChronofoldDashboardUI event
   |
   v
ChronofoldMain validates and mutates state
   |
   v
ChronofoldMain calculates totals and render model
   |
   v
ChronofoldDashboardUI rebuilds affected visual state
```

This direction keeps the controller authoritative. The dashboard emits intent and receives state.

## Task model

Every task has one logical lane:

| Lane | Meaning | Visible in the active view |
| --- | --- | --- |
| `today` | Scheduled inside the focused day | Yes |
| `overflow` | Deliberately outside the available-day plan | Yes, as `DOESN'T FIT` |
| `tomorrow` | Deferred from the focused day | No, stored as a logical queue |

The Tomorrow lane is not a second rendered board in the current release. Moving or rescheduling a task to Tomorrow removes it from the active Today and overflow surfaces.

## Scheduling and capacity

Capacity starts from the `capacityMinutes` script input and is converted to seconds for runtime comparisons.

For a new task:

```text
remaining = capacitySeconds - todaySeconds

if taskDuration <= remaining
  lane = today
else
  lane = overflow
```

For duration changes, the selected task is updated in place. If a task in Today causes the lane to exceed capacity, that task is moved to overflow. Existing tasks are not globally reordered by duration and the controller does not solve an optimization problem.

Changing capacity recalculates display totals and meter state. It does not move existing tasks automatically.

## Layout and reflow

The dashboard uses a runtime-generated hierarchy made from UIKit controls, `Text`, `Image`, and helper scene objects.

Today cards are placed into rows. Tasks marked `halfWidth` can share a row. Other tasks span the available task area. Overflow cards use a narrower vertical stack.

After any mutation, the view removes the old dynamic card objects after a short deferred cleanup and builds a new set from the task model. This produces the visible reflow. It also avoids leaving interaction geometry at old card positions.

## Interaction architecture

### UIKit controls

Action buttons, capacity controls, workflow buttons, and timer controls use Spectacles UIKit components backed by SIK interactables.

### Hand drag

Task cards use custom hand tracking instead of persistent UIKit interactables. The view obtains both hands from `HandInputData`, reads index-thumb pinch state each frame, and selects the nearest active task handle. While a pinch is held, the card follows the interaction position. On release, the X position determines whether the destination is Today or overflow.

This path supports either hand and feeds a `TaskDropData` event into the controller.

### Preview cursor drag

The desktop fallback listens for `TouchStartEvent`, `TouchMoveEvent`, and `TouchEndEvent`. The Preview pointer is projected through the active camera into the dashboard plane. The same destination rule and task-drop event are used after release.

### Action selection

Actions use a guided state machine:

1. User chooses an action.
2. The dashboard asks for a task when the action requires one.
3. The selected task key is returned to the controller.
4. The controller requests any additional choice or duration input.
5. Validated input is applied once.
6. The dashboard rerenders from current state.

## Keyboard input

The dashboard uses `TextInputSystem` with two keyboard modes:

- text input for task names
- numeric input for durations and capacity

Task duration is collected as hours, minutes, and seconds. Capacity is collected as hours and minutes. The controller rejects empty names, nonpositive durations, and capacity values outside the supported range.

## Timer lifecycle

The controller binds one `UpdateEvent` and compares Lens time against an accumulated timer state.

```text
idle -> running -> paused -> running -> complete
                     |
                     `-> stopped -> idle
```

Completion is guarded so the same timer cannot complete twice. The completion state is rendered in the Lens. There is no background process after the Lens stops.

## Assets and packages

Runtime-owned assets are limited to:

- Space Grotesk font
- action and task icon textures
- one cloned image material for icons
- two interaction sound files
- camera and render target assets
- the authored scene
- the three Chronofold TypeScript modules

The project packages include Spectacles Interaction Kit, Spectacles UIKit, and the Preview inspection and interaction packages used during development and verification. Leaf and Bitmoji package files remain because they are dependencies of the installed Preview tooling.

## Verification hooks

`ChronofoldMain` exposes two disabled-by-default Inspector inputs:

- `runFunctionalSelfTestOnStart` runs deterministic action, capacity, timer, and cancellation checks, then restores the original state.
- `previewTimerAlertOnStart` opens the completion state at startup for visual inspection.

These flags are intended for Preview verification and should remain off in the normal experience.

