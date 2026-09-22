# Architecture

## Runtime layers

React owns semantic UI, routes, content, accessibility, and data state. It must not own per-frame particle state.

A single persistent Three.js scene surface owns dense visual rendering. Route/section state is passed to the renderer as coarse scene intents rather than React updates every frame.

Motion handles DOM/SVG micro-interactions, route accents, line/path gestures, and controls that benefit from browser-native animation.

Native Web Audio owns sample playback, scheduling, buses, and interaction-driven sound. Audio state is independent from the render loop but may expose low-rate analysis values.

## Suggested boundaries

- src/app - router and application shell.
- src/pages - route-level content.
- src/core/render - renderer, scene state, quality governor hooks.
- src/core/audio - audio graph, scheduler, buses, interaction events.
- src/core/performance - frame-time sampling and quality tiers.
- src/services - GitHub/SoundCloud network adapters.
- src/content - human-editable profile/content config.
- src/shaders - GLSL or shader chunks imported as raw text.
- src/styles - tokens and global/layout styles.

## Deployment

Start static-first. Cloudflare Pages is a good production target. Add a Pages Function/Worker only for authenticated GitHub status or other secret-backed integrations.
