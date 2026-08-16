# Chronofold design notes

## Design premise

Chronofold treats available time as a bounded physical resource. The main surface is intentionally closer to a packing board than a calendar list. Tasks become objects with visible size, location, and movement.

The canonical concept reference is `design/02_finished_product_hero.png`. Release screenshots in `docs/images` show the implemented Lens rather than the concept artwork.

## Visual hierarchy

The interface has five functional regions:

1. Brand and purpose at the top
2. Today capacity, meter, and scheduled total
3. Action rail on the left
4. Today cards in the center
5. `DOESN'T FIT` cards on the right

The status panel sits below the card area and the interaction hints sit below the status. This keeps the capacity decision above the task surface and the result of that decision below it.

## Task cards

Task cards use a high-saturation palette against dark translucent panels. Color separates tasks without requiring every card to carry an extra category label. Icons provide a second cue.

The sample layout uses two card widths:

- half-width cards for short tasks that can share a row
- full-width cards for longer or emphasized tasks

Duration remains explicit as text. The current implementation does not map every minute to a continuously proportional card width or height. Instead, duration is communicated through labels and a small set of layout forms.

## Capacity and overflow

The meter shows the relationship between scheduled time and the configured Today capacity. The capacity pill is editable because a fixed workday would be a false assumption.

Overflow is given a physical lane, not only a red counter. A task can be held over that lane and released into it. That action turns an abstract overcommitment into a visible placement decision.

When overflow reaches zero, the lane remains present and reports that everything fits today. Keeping the empty lane visible preserves the mental model and gives the user a stable drop target.

## Materials and typography

The board uses dark smoke-like surfaces with controlled opacity. The intent is to stay readable in a real environment without pretending to be an opaque desktop window.

Space Grotesk is used throughout the custom dashboard. Large headings are concise, task labels have stronger contrast, and duration text is smaller but remains visible at the intended viewing distance.

## Spatial placement

The dashboard is attached to a dedicated canvas view rig and placed in front of the camera. The active authored dashboard has a world-space center offset and a global scale near the maximum of its exposed Inspector range. The placement was tuned against the Lens Studio Preview framing rather than against the Scene panel alone.

This matters because runtime camera tracking, parent transforms, and Preview framing can produce a different result from authored coordinates.

## Interaction feedback

Dragging changes the task's position immediately. The status panel identifies the active hand, names the current destination, and instructs the user to release. Grab and drop sounds provide short confirmation without becoming part of the timer audio.

Action flows reduce accidental edits by separating action selection, task selection, input, and confirmation. Destructive removal requires confirmation.

## Design tradeoffs

- The overflow lane is always visible, which costs horizontal space but makes capacity concrete.
- Runtime card rebuilding keeps layout state simple but requires careful cleanup and interaction-layer management.
- Custom task dragging is more robust during rebuilds than persistent task interactables, but it uses a simple horizontal destination rule.
- The visible board focuses on Today and overflow. Tomorrow is stored in state but is not yet presented as a second board.
- The status message evaluates the Today lane while the overflow total is shown separately. This preserves the current implementation but can read as contradictory when overflow still contains tasks.

## Known visual issue

In Lens Studio Preview, workflow modal content can render behind task cards after dynamic rebuilds. The controls remain part of the runtime hierarchy, and overlay ordering is a documented follow-up item for a dedicated top render layer and collider-order check.
