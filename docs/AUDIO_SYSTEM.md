# Audio system

## Principle

The site is not a background-music player. It is a procedural UI soundscape assembled from a small authored palette of samples plus restrained synthesis.

## Gesture gate

Create/resume AudioContext only after the entry PRESS interaction. Browsers commonly block audible autoplay before explicit user interaction.

## Buses

- UI: tiny clicks, tactile confirmations.
- TEXTURE: air, dust, reverse tails, low-level motion.
- TONAL: sparse plucks/grains in one coherent scale.
- TRANSITION: rare swells/impacts for route or scene changes.

## Scheduling

Use AudioContext.currentTime and scheduled AudioParams/BufferSourceNodes for timing-critical events. Avoid musical timing driven by setTimeout.

## Interaction mapping

Hover/focus may trigger very quiet micro feedback. Press/navigation may trigger stronger but short events. Route changes can schedule a motif or transition. Do not sonify every pointer movement.

## Mixing

Keep wide dynamic headroom. Limit repeated high-frequency ticks. Use master gain plus a persistent mute control. Never surprise the user with loud audio.

## Visual link

Expose coarse analyzer/energy values at a controlled rate for the WAVE scene. Do not couple rendering correctness to audio playback.
