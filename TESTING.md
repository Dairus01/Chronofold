# Chronofold testing

## Verification approach

Chronofold is tested in layers:

1. TypeScript compilation
2. Runtime startup and Logger inspection
3. Deterministic controller self-test
4. Live Preview interaction
5. Runtime scene inspection
6. Screenshot review
7. Asset and public-repository checks

The release audit was performed in Lens Studio 5.23.1 with the project targeting Spectacles. Physical Spectacles hardware was not available, so device-only behavior remains a separate release check.

## Compile and startup

The final release candidate must pass a forced TypeScript recompile. A Preview refresh must then produce all of the following without runtime errors:

```text
SIK Version : 0.18.0
[Chronofold] STATE today=18000s overflow=6300s tomorrow=0s
[Chronofold] READY functional spatial schedule loaded
[Chronofold] HAND TRACKING ready for left/right index-thumb pinch
```

Compile success alone is not enough. The runtime messages confirm that the scene loaded, the dashboard initialized, the sample task state was calculated, and both hand providers were connected.

## Built-in functional self-test

`ChronofoldMain` has an Inspector input named `runFunctionalSelfTestOnStart`. It is off for normal use.

For a test run:

1. Enable `runFunctionalSelfTestOnStart` on `Chronofold App`.
2. Recompile TypeScript.
3. Refresh Preview and collect the startup log.
4. Confirm every line beginning with `[Chronofold][SELFTEST]` reports `PASS`.
5. Confirm the final state is restored to `today=18000s overflow=6300s tomorrow=0s`.
6. Disable the input again.
7. Recompile and refresh once more for the release state.

The release audit passed these checks:

| Self-test | Result |
| --- | --- |
| Reject zero capacity | Pass |
| Cancel capacity edit without mutation | Pass |
| Accept hours and minutes for capacity | Pass |
| Update focused-day capacity | Pass |
| Accept a valid task name | Pass |
| Accept hours, minutes, and seconds for a task | Pass |
| Preserve exact task seconds | Pass |
| Replace task duration | Pass |
| Move a task to Tomorrow | Pass |
| Reschedule an overflow task | Pass |
| Remove the selected task | Pass |
| Start a selected task timer | Pass |
| Pause the timer | Pass |
| Resume the timer | Pass |
| Notify once on completion | Pass |
| Cancel Add Task without mutation | Pass |
| Restore the initial schedule after the run | Pass |

## Live Preview interaction checks

The automated controller checks do not replace visual and interaction checks. The release audit also performed these actions in the running Preview:

| Interaction | Expected result | Result |
| --- | --- | --- |
| Pinch Email and Planning with the right hand | Card enters held state | Pass |
| Drag the held card toward overflow | Card follows the hand and destination feedback changes | Pass |
| Release in overflow | Task lane changes to overflow | Pass |
| Inspect logs after release | Drop is logged with task, hand, destination, and position | Pass |
| Inspect Today after drop | Remaining Today cards close the empty slot | Pass |
| Inspect overflow after drop | Email and Planning appears above the existing overflow tasks | Pass |
| Drag Client Meeting with the Preview cursor | Cursor acquires the task and releases it in overflow | Pass |
| Inspect state after cursor release | Today decreases by 30 minutes and overflow increases by 30 minutes | Pass |
| Run Reschedule for Workout | Workout moves to the logical Tomorrow queue | Pass |
| Run Reschedule for Grocery Run | Grocery Run moves to the logical Tomorrow queue | Pass |
| Inspect the cleared overflow lane | Lane reports that everything fits today | Pass |
| Inspect state totals | Today remains 5 hours and overflow becomes zero | Pass |

The final Preview verification injected a complete cursor drag through the Lens Studio mouse and touch event path. The Logger recorded `CURSOR GRAB Client Meeting`, `CURSOR RELEASE Client Meeting -> overflow`, and the resulting Today and overflow totals.

## Screenshot checks

Release screenshots are stored in `docs/images/`.

| File | State checked |
| --- | --- |
| `chronofold-main-view.png` | Initial Today and overflow layout |
| `chronofold-task-drag.png` | Held task and hand destination feedback |
| `chronofold-overflow-reflow.png` | Post-drop lane reflow and totals |
| `chronofold-success-state.png` | Cleared overflow and success totals |
| `chronofold-main-preview.png` | Lens inside the actual Lens Studio Preview panel |

Each image was opened after capture and checked for framing, legibility, missing assets, card overlap, and correspondence with the runtime state.

The capacity-editor state was intentionally excluded from the public image set. In the current Preview, the workflow overlay can be occluded by dynamically rebuilt task cards. The issue is documented rather than hidden behind a favorable crop.

## Repository integrity checks

The release preparation process must also confirm:

- no unresolved asset references in the active scene
- no TypeScript compile errors
- no runtime errors after Preview refresh
- no disabled legacy Chronofold scene root
- no unused legacy materials or duplicated design textures in `Assets/`
- local MCP configuration is ignored
- private debug keys are ignored
- generated Lens Studio cache and workspace state are ignored
- no em dash characters in public files
- no credentials, tokens, passwords, or machine paths in files selected for commit

## Device test still required

Before store submission or a public demo on hardware, repeat these checks on physical Spectacles:

- left-hand pinch acquisition
- right-hand pinch acquisition
- direct and indirect target comfort
- task drag stability while moving the head
- text and numeric keyboard entry
- timer alert visibility and audio level
- panel readability in bright and dark rooms
- frame time and thermal behavior during a longer session
