# Performance and QA

## Targets

Stable 60fps is the baseline. 120fps may be used when frame time shows headroom. Performance quality adapts continuously; do not classify devices by model name.

## Quality governor

Measure rolling frame time and change only one quality step at a time with hysteresis. Candidate knobs: render resolution, ASCII cell size, particle count, bloom passes, noise octaves, and update frequency.

## Rendering rules

Keep dense ASCII/dither/particle work on GPU where practical. React must not re-render per frame. Avoid layout animation for high-frequency effects; prefer transform/opacity for DOM motion.

## Test viewports

At minimum: 1440×900 desktop and 390×844 mobile. Also inspect a wide desktop and a reduced-motion run before major visual milestones.

## Visual checks

No blank canvas, clipped primary content, accidental overlap, unreadable PRESS hint, stuck loader, or route transition that leaves the scene in an invalid state.

## Automated checks

Run typecheck, lint, unit tests, and production build. Use Playwright screenshots for visual changes and check browser console errors.

## Fallbacks

WebGL failure or reduced capability must leave a usable semantic site. A calm DOM/CSS fallback is preferable to a broken "wow" effect.
