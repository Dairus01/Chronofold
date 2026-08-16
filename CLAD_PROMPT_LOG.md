# Chronofold CLAD prompt log

This log documents the major CLAD and Codex iterations used to build Chronofold, from the initial spatial planning concept through implementation, Preview testing, interaction work, visual refinement, and release preparation. Prompt wording is condensed for readability where needed.

Chronofold was advanced through repeated loops in one stable pattern:

Prompt to CLAD and Codex
Build a small change
Compile TypeScript
Run in Lens Studio SPECS Preview
Interact with the result
Inspect logs and scene state
Capture and compare screenshots
Refine based on the next mismatch

## Development at a glance

Chronofold was built through 14 major CLAD passes:

1. Spatial planning concept
2. Scene and container architecture
3. Visual system and typography
4. Responsive spatial layout
5. Preview framing and visual QA
6. Lens Studio documentation and project rules
7. Runtime UIKit architecture
8. Task management workflows
9. Task timer
10. Two hand pinch interaction
11. Preview cursor interaction
12. Editable day capacity
13. Reflow and rescheduling behavior
14. Release verification and repository cleanup

Each major change followed the same loop:

Prompt -> Build -> Compile -> Preview -> Interact -> Inspect -> Refine

## 1. Establish the spatial planning concept

### Prompt

> Build a Snap Spectacles spatial planner based on the Chronofold references. Tasks should occupy physical space and make overcapacity visible.

### Result

The first build introduced Today and overflow containers, task cards, duration labels, and a default five hour day. Tasks were grouped by lane and shown with capacity totals so that overloaded schedules became visibly visible in space.

### Verification

Initial scene compile and preview run completed. Early screenshot passes were compared with the reference visual direction.

### Issue

The concept landed, but the interface lacked the final hierarchy, proportion, and readability of the finished look.

### Follow-up

Focus on spacing, panel treatment, and typography before adding more workflow complexity.

## 2. Build the first authored scene hierarchy

### Prompt

> Turn the concept into an explicit scene structure with cards, containers, materials, and interaction targets.

### Result

An authored `Chronofold` hierarchy was created with Today and Tomorrow roots, a glass style treatment, action rows, status panels, and overflow handling. The structure validated the core experience while making iteration easier in the short term.

### Verification

TypeScript compile passed and preview states were captured for overcapacity and successful fit.

### Issue

As features grew, the large authored tree was difficult to tune. Small changes touched many nodes and created drift between intended and runtime behavior.

### Follow-up

Shift to a runtime generated dashboard with a single state model while preserving the proven visual direction.

## 3. Improve typography and panel contrast

### Prompt

> Improve type hierarchy and contrast for cards, actions, and panels to match the polished reference feel.

### Result

Text and visual contrast were tuned with stronger labels, clearer duration hierarchy, and tighter action spacing. Material values were adjusted to preserve card legibility in the active viewing distance.

### Verification

Panel and task captures were reviewed directly in Preview at the final framing used by judges.

### Issue

Edits made in the Scene panel did not always map to the final interaction view.

### Follow-up

Set Preview as the acceptance view and keep each spacing change narrowly scoped.

## 4. Make the dashboard wider

### Prompt

> Expand the active board area so task names, durations, and actions are easier to read and use in normal preview frame.

### Result

Multiple board-scale and panel-extent iterations increased horizontal spread and reduced density. The layout became easier to read in successful passes.

### Verification

Each iteration was validated with a fresh preview frame and runtime check against target composition.

### Issue

Early scaling attempts shifted cards outside expected alignment and introduced overlap between task content and action controls.

### Follow-up

Stabilize by adjusting camera rig and parent offsets with one spatial control at a time.

## 5. Correct camera framing and restore layout integrity

### Prompt

> Do not finalize until the actual runtime Preview output is verified. Capture and compare every layout change.

### Result

Camera, rig alignment, and dashboard placement were rechecked together. The board reached a stable position with improved readability and fewer overlaps.

### Verification

Preview captures were used as the single acceptance artifact for framing and spacing quality.

### Issue

One framing correction brought stability but reduced usable width, which did not satisfy the visibility goal.

### Follow-up

Preserve a readable frame while reintroducing a wider spread through the rebuilt runtime layout path.

## 6. Study Lens Studio and formalize project memory

### Prompt

> Study the official Lens Studio references before continuing implementation. Capture constraints in reusable project memory and interaction rules.

### Result

Project documentation was consolidated into permanent memory and a Chronofold skill profile. This recorded API boundaries, interaction lifecycles, camera and coordinate checks, and screenshot verification flow.

### Verification

The memory and skill artifacts were read before the next visual passes. All Lens interaction was executed through the approved MCP workflow.

### Issue

Scene order, dynamic rebuild behavior, and input interactions still needed several in Preview experiments before behavior matched intent.

### Follow-up

Use documented constraints as hard requirements and continue iterative verification in Preview.

## 7. Replace the prototype with a runtime UIKit dashboard

### Prompt

> Keep the spatial concept but move the surface to a runtime constructed dashboard with one state model and deterministic behavior.

### Result

The implementation moved to `ChronofoldMain` and `ChronofoldDashboardUI`. The controller now owns scheduling, actions, capacity, timer state, and all mutations while the dashboard reconstructs the UI from that model.

### Verification

Startup logs confirmed valid totals and hand state messages. Visual inspection in Preview confirmed the runtime-built board and card reconstruction.

### Issue

The previously authored disabled root and legacy resources still existed in the working scene and asset tree during transition.

### Follow-up

Treat the runtime build as the release path and remove unused legacy content during cleanup.

## 8. Make every action functional

### Prompt

> Implement complete action flows for Add Task, Adjust Duration, Move Tomorrow, Reschedule, Remove, and timer controls.

### Result

A guided action state machine was added with prompts for task selection, input requests, validation, and confirmation. New tasks respect day capacity and overflow placement. The same action framework now drives all planner operations.

### Verification

Actions were triggered in Preview. Logger data and stack order were inspected after each action. A deterministic self test validated major action paths.

### Issue

Persistent interactables were not stable across frequent card rebuilds, and overlays could compete with task geometry.

### Follow-up

Use UIKit interactables for fixed controls and keep task movement on a custom drag path tied to rebuild timing.

## 9. Add the task timer

### Prompt

> Add task timing with start, pause, resume, stop, and completion behavior, including one alert on completion.

### Result

Timer lifecycle was added with guarded completion and in lens alert. The timer tracks remaining seconds via frame-safe timing and supports pause and resume transitions.

### Verification

The deterministic self test started and paused a timer, resumed it, forced completion, and confirmed completion fired once.

### Issue

Completion is limited to the Lens session and does not run outside an active Lens environment.

### Follow-up

Document the boundary clearly and keep platform level notifications as future work.

## 10. Add two hand pinch dragging

### Prompt

> Support real-time task movement with the index finger and thumb of either the left or right hand. Tasks should follow the active hand while pinched and resolve to Today or Doesn't Fit on release.

### Result

The dashboard now reads `HandInputData` for both hands, detects index thumb pinch state each frame, selects nearest task handles, and routes destination by board position at release.

### Verification

Hand interaction simulation was run for both hands in Preview. Held state, destination feedback, and drop state transitions were confirmed in logs.

### Issue

Task card movement needed to bypass stale interactable targets when cards are rebuilt.

### Follow-up

Keep task movement on a hand aware adapter and route outcomes through a shared `TaskDrop` path.

## 11. Restore mouse and cursor task movement

### Prompt

> Restore task dragging with mouse and Preview cursor after hand interaction changes, and keep behavior aligned with hand drop logic.

### Result

Cursor drag was implemented with `TouchStartEvent`, `TouchMoveEvent`, and `TouchEndEvent`, plus world projection from the active camera. Cursor and hand both feed the same drop handling.

### Verification

Cursor grab, miss, and drop paths were validated in Preview logs with successful lane transitions and visual feedback checks.

### Issue

Screen coordinate estimates from screenshots were noisy during broad layout checks.

### Follow-up

Use runtime positions and live interaction events as the primary verification source for input behavior.

## 12. Make day capacity editable

### Prompt

> Replace the fixed hardcoded day duration with an editable capacity flow.

### Result

Capacity is now editable through minutes and hours input with range validation from one minute to twenty four hours. Totals and meter state update after each accepted change.

### Verification

Preview tests covered cancel, reject, and valid updates, including a six hour thirty minute adjustment.

### Issue

Capacity updates recalculate scheduling totals and fit state but do not automatically rebalance all existing tasks across lanes.

### Follow-up

Keep this behavior stable in the current version and document the clear model for future optimization.

## 13. Verify adaptive reflow and logical Tomorrow behavior

### Prompt

> Confirm that movement and rescheduling update lane state, trigger automatic reflow, and clear overflow correctly.

### Result

Rescheduling moved tasks to a logical Tomorrow queue, overflow reflowed after each move, and the final state reached clean fit. Today and overflow totals matched expected values after the pass.

### Verification

Logger lines recorded rescheduling moves and final totals. Screenshots captured intermediate reflow and final success states.

### Issue

The finished design keeps Tomorrow as a logical queue rather than rendering a second persistent board.

### Follow-up

Document this as an intentional design choice and keep the active focus on Today and overflow where spatial fit is most visible.

## 14. Prepare a public, judged release

### Prompt

> Audit the project for public sharing, remove development-only materials, capture final screenshots, and align documentation for hackathon submission.

### Result

The build was cleaned of unused legacy assets and development-only files, with `.gitignore` updated to exclude cache, workspace, local configuration, temporary captures, local credentials, and generated artifacts. Public documentation and final verification images were organized under `docs/images`. Final project validation included compile, self test, hand and cursor interaction checks, screenshot review, and dependency checks.

### Verification

Public repo candidates were scanned and verified for accuracy, screenshot evidence, and clean references. Logs and checks remained consistent with the functional release state.

### Issue

No blocking functional issues remained for the submitted Lens experience.

### Follow-up

Keep release notes concise and CLAD evidence complete so judges can trace prompt iteration through tested outcomes.

## Final development pattern

This log shows a complete engineering cycle:

Prompt -> Build -> Compile -> Preview interact -> Inspect -> Refine

Chronofold evolved from an initial spatial mockup into a responsive Lens with shared schedule state, runtime-generated cards, hand drag, Preview cursor drag, editable capacity, timers, reflow, and action-driven planning flows.

CLAD and Codex were not only used to generate code. They were used continuously for scene inspection, verification, error correction, and iteration, which is reflected in the logged flow from prompt to fix at each milestone.
