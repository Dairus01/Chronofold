# Chronofold CLAD prompt log

This is a truthful development record for the Chronofold Lens. It summarizes the meaningful requests, implementation passes, Preview checks, mistakes, and corrections that led to the current release. Prompt wording is condensed for readability. It is not presented as a verbatim chat transcript.

The process was not linear. Several visual passes made the result worse, a camera adjustment returned the layout to an earlier state, and hand work briefly left the mouse path unreliable. Those failures are included because they shaped the final implementation.

## 1. Establish the spatial planning concept

### Prompt / Goal

Build a Spectacles planner based on the supplied Chronofold references. Tasks should occupy physical space, Today should have a visible capacity, and work that does not fit should sit outside the day.

### Result

The first implementation established the brand, Today and Tomorrow concepts, colored task blocks, duration labels, capacity totals, and an overflow area. The schedule used the reference tasks and the five-hour day shown in the design.

### Verification

The scene was compiled and opened in Lens Studio Preview. Screenshots were compared with the supplied finished-product reference.

### Issue

The basic concept was recognizable, but the visual hierarchy, scale, spacing, and text treatment were substantially weaker than the reference. The experience looked like an early scene assembly rather than a finished spatial interface.

### Follow-up

The next passes focused on geometry, panel treatment, and typography before adding more behavior.

## 2. Build the first authored scene hierarchy

### Prompt / Goal

Turn the concept into explicit Lens Studio scene objects with task containers, cards, labels, materials, and interaction targets.

### Result

An authored `Chronofold` root was created with Today and Tomorrow boards, task objects, glass materials, glow materials, an action panel, success state, and overcapacity state. Controller and visual-polish scripts managed the hierarchy.

### Verification

The scene hierarchy was inspected, TypeScript compiled, and both overcapacity and successful-fit Preview states were captured.

### Issue

The large authored hierarchy was expensive to tune and easy to desynchronize. Visual adjustments accumulated across many objects, and later runtime interaction changes did not fit cleanly into the original structure.

### Follow-up

Keep the authored version while testing the visual language, then evaluate a runtime-generated dashboard with one state model.

## 3. Improve typography and panel contrast

### Prompt / Goal

Make the interface easier to read and closer to the polished reference. Improve the action panel, task labels, durations, and glass surfaces.

### Result

Typography scripts applied stronger hierarchy, and panel materials were adjusted for deeper glass, brighter accents, and better contrast. Action rows gained icons and more consistent spacing.

### Verification

Preview screenshots were captured before and after the type changes and reviewed at the actual Preview scale.

### Issue

Some fixes were judged in the Scene panel or at a different camera framing. They looked acceptable in isolation but became too small or too dense in the normal Preview.

### Follow-up

Use the normal Preview frame as the acceptance view and capture a screenshot after every spatial change.

## 4. Make the dashboard wider

### Prompt / Goal

Use more of the available horizontal space so task names and durations are easier to see, while keeping the appearance of the finished-product reference.

### Result

The dashboard scale, panel positions, and card widths were increased across several passes.

### Verification

Each pass was captured in Preview and compared with the design target.

### Issue

The first widening attempt pushed parts of the UI out of alignment. A later pass made task cards wider but caused the action column and task content to overlap. Another adjustment compressed the visible board into a narrow center strip. These were regressions, not improvements.

### Follow-up

Restore a known readable frame, inspect the camera and parent transforms, then change one spatial variable at a time.

## 5. Correct camera framing and restore layout integrity

### Prompt / Goal

Stop declaring visual completion without checking the actual output. Take screenshots, compare them with the target, and continue when the result is visibly wrong.

### Result

The camera rig, canvas placement, dashboard scale, and panel spread were inspected separately. The board was returned to a stable position and widened without repeating the severe overlap.

### Verification

Normal Preview screenshots were used as the acceptance source. The user-provided regression screenshots were also used to identify where the previous passes failed.

### Issue

One correction returned the board close to its original small state. It fixed the overlap but did not satisfy the request for better use of space.

### Follow-up

Rebuild the layout around fixed panel roles instead of continuing to stretch the old hierarchy.

## 6. Study Lens Studio and formalize project memory

### Prompt / Goal

Study the official Lens Studio documentation before continuing. Preserve the learned constraints in reusable project memory, a Chronofold skill, and an agent profile.

### Result

The project gained a documentation study, permanent memory, visual acceptance rules, a Chronofold spatial UI skill, and a dedicated agent profile. The notes covered Lens and Editor API separation, lifecycle order, world units, camera framing, UIKit, SIK, Preview inspection, keyboard input, interaction layering, and screenshot verification.

### Verification

The memory and skill files were read before later Chronofold visual work. Lens Studio operations were routed through the connected integration rather than raw HTTP.

### Issue

Documentation helped set the implementation constraints, and several behaviors were validated through iterative Preview checks because scene order, dynamic construction, and input paths interacted in project-specific ways.

### Follow-up

Use the documentation as constraints, then verify each assumption in the running Lens.

## 7. Replace the disabled prototype with a runtime UIKit dashboard

### Prompt / Goal

Create a cleaner, wider, more maintainable dashboard while preserving the spatial schedule concept.

### Result

The active experience moved to `ChronofoldMain` and `ChronofoldDashboardUI`. The controller became the owner of task state, capacity, actions, and timer behavior. The view began creating UIKit panels, action buttons, task cards, prompts, and status elements at runtime.

### Verification

The active runtime roots were queried in Preview. Startup logs confirmed the initial Today and overflow totals. Screenshots confirmed the new board in the Specs room environment.

### Issue

The older authored `Chronofold` hierarchy remained disabled in the scene and its materials, scripts, meshes, and duplicated design textures stayed in `Assets/`. That made the project harder to audit and could mislead anyone reading the source.

### Follow-up

Treat the runtime UIKit build as the release implementation and remove the disabled branch during public repository preparation.

## 8. Make every action functional

### Prompt / Goal

The action buttons must perform real work. Add Task should ask for a name and duration. Adjust Duration should ask for a task and replacement duration. Move Tomorrow, Reschedule, Remove Task, and timer controls should complete their workflows.

### Result

The controller gained a guided action state machine. The dashboard gained task selection prompts, text input, hours-minutes-seconds duration input, destination choices, confirmation buttons, and cancellation behavior. New tasks are assigned to Today when they fit and overflow when they do not.

### Verification

Actions were triggered in Preview, state changes were checked in the Logger, and task stacks were inspected after each mutation. A deterministic self-test was added to cover the complete controller path.

### Issue

Dynamic task rebuilds created stale interaction targets when cards used ordinary persistent interactables. Some workflow overlays also competed with the task layer for render and collider order.

### Follow-up

Use UIKit interactables for stable controls and a custom adapter for rebuilt task cards.

## 9. Add the task timer

### Prompt / Goal

Let the user start a task, track its remaining time, and receive a reminder when the time ends.

### Result

The controller gained start, pause, resume, stop, and complete states. Remaining time is calculated during `UpdateEvent`. Completion is guarded so it fires once and opens an in-Lens alert. A Preview-only flag was added for visual testing of the completion state.

### Verification

The functional self-test started a task, paused it, resumed it, forced completion, called completion twice, and confirmed that the notification count increased only once.

### Issue

The alert is limited to the active Lens. It is not a background operating-system notification and cannot continue after the Lens stops.

### Follow-up

Document that boundary clearly and keep background notification work as a future platform-dependent feature.

## 10. Add two-hand pinch dragging

### Prompt / Goal

Support real-time task movement with the index finger and thumb of either the left or right hand.

### Result

The dashboard integrated `HandInputData` and `BaseHand`. It tracks both hands, detects index-thumb pinch state, selects the nearest task handle, updates the held card every frame, and reports a Today or overflow destination on release.

### Verification

Preview hand simulation was used to pinch Email and Planning, drag it across the board, hold it over `DOESN'T FIT`, and release it. Logs recorded the hand, task, destination, and drop position. A screenshot was captured while the task was held.

### Issue

Task cards could no longer depend on the earlier standard interactable path because rebuilt cards made those targets stale. The custom hand path worked, but desktop testing needed a separate adapter.

### Follow-up

Restore Preview cursor dragging against the same task-drop event used by hand input.

## 11. Restore mouse and cursor task movement

### Prompt / Goal

Dragging with the mouse had stopped working after the hand-tracking feature. Restore the ability to move tasks between Today and `DOESN'T FIT` through Preview cursor interaction.

### Result

The view gained `TouchStartEvent`, `TouchMoveEvent`, and `TouchEndEvent` handling. Preview coordinates are projected through the camera into the dashboard plane, the nearest task is acquired, and release sends the same drop payload used by hand input.

### Verification

Cursor grabs and misses were printed in Preview logs. A successful cursor grab was confirmed, and later visual QA captured the mouse-drag state.

### Issue

Preview screenshot coordinates include panel chrome and letterboxing, so estimating input positions from screenshots was unreliable.

### Follow-up

Use runtime object positions and interaction tools for automated checks. Reserve screen-coordinate injection for cases where exact coordinates are obtained from the running view.

## 12. Make day capacity editable

### Prompt / Goal

Replace the hardcoded five-hour day with a capacity the user can change for the focused day.

### Result

The Today header gained an editable capacity pill. The workflow accepts hours and minutes, validates a range from 1 minute to 24 hours, updates the meter, and recalculates schedule totals. The default remains five hours.

### Verification

Capacity cancellation and a six-hour-thirty-minute update were tested in Preview. The self-test confirmed zero-capacity rejection, cancellation without mutation, valid input acceptance, and the updated controller value.

### Issue

Changing capacity does not automatically move existing tasks between Today and overflow. During the final release audit, the modal content was also found to render behind rebuilt task cards in the current Preview layer order.

### Follow-up

Keep the working capacity model, document the lack of automatic rebalance, and record the modal layering defect as a known limitation.

## 13. Verify reflow and logical Tomorrow behavior

### Prompt / Goal

Confirm that task movement changes real state, that card stacks reflow, and that successful fit is not only a static screenshot.

### Result

Workout and Grocery Run were moved through the Reschedule workflow into the logical Tomorrow queue. The overflow stack closed after the first move and cleared after the second. The displayed totals changed from one hour and forty-five minutes of overflow to zero.

### Verification

Runtime logs confirmed `Workout -> tomorrow` and `Grocery Run -> tomorrow`. Fresh screenshots captured the intermediate reflow and final success states.

### Issue

The active view does not render a Tomorrow board. A task moved there leaves the visible board and can only be observed through state and logs.

### Follow-up

Describe Tomorrow as a logical queue in the release documentation and list a visible Tomorrow view as future work.

## 14. Prepare the public repository

### Prompt / Goal

Audit the complete project, remove development-only content, capture real release screenshots, write accurate documentation, scan for secrets, and prepare a logical commit plan without pushing.

### Result

The disabled authored `Chronofold` scene root was removed through Lens Studio. Sixty-one unused legacy assets were deleted through the Lens Studio asset interface. Ten additional unused font and starter-material assets were removed. The active Lens was recompiled and refreshed after cleanup.

The repository ignore rules were expanded to exclude generated cache, workspace state, MCP configuration, local agent settings, temporary screenshots, debug signing keys, and machine-local files. Public documentation and fresh Preview images were added.

### Verification

The final audit ran the complete deterministic self-test, manually exercised hand drag and rescheduling, inspected runtime state, captured and opened every public screenshot, recompiled TypeScript, refreshed Preview, and checked the Logger.

### Issue

The local MCP configuration contained an authentication credential and the project root contained a private debug key. Neither belongs in public history. The remote repository was also empty and the local folder had not yet been initialized as a Git repository.

### Follow-up

Ignore local credentials and generated files, scan the exact set of files planned for commit, initialize the local repository with the supplied remote, and stop for owner approval before any commit or push.

## Final development pattern

The completed project came from the following loop:

```text
Prompt
  -> inspect scene and runtime state
  -> build a small change
  -> compile TypeScript
  -> run the Lens in Preview
  -> interact with the result
  -> inspect logs and state
  -> capture a screenshot
  -> compare and correct
```

The most important lesson was simple: a scene change is not verified when the code compiles. It is verified when the running Preview, interaction behavior, Logger, and captured frame agree.
