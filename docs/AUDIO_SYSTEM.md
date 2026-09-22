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

## Adding authored audio

Place WAV or Ogg files in `public/audio/` and set their `src` in
`public/audio/manifest.json`. Null entries deliberately make no asset requests.
The concrete production brief is in `docs/SOUND_ASSET_BRIEF.md`.
The current authored slots are ambience, press, hover, reveal, route, and toggle.
WAV and Ogg assets are decoded into
AudioBuffers. Keep files short and reasonably sized: the first gesture creates
and resumes the context, then decodes configured assets. Entry allows 120ms for readiness before scheduling
the procedural fallback; late assets are used by later interactions.
The visual entry never waits for audio. Missing or invalid assets fall back to the
procedural press/reveal; hover and ambience stay silent.

The manifest has independent gains for ambience, press, hover, reveal, route,
and toggle. All six buses feed the master gain controlled by the corner glyph meter.
Mute is independent of the stored volume; adjusting volume while muted keeps it
muted. Volume and mute persist locally. Hidden tabs suspend playback, and returning
resumes the same audio context without creating another loop.

### Loop preparation

Prefer trimming head/tail silence in the audio editor and auditioning the seam
before export. `loopStart` and `loopEnd` are seconds in the decoded asset; null
`loopEnd` uses its duration. Optional `trimSilence` narrows that range to samples
above -60dB on any channel. All-silent files retain their original bounds.

`crossfadeSeconds` optionally overlaps the end and beginning in a prepared buffer.
The default 40ms linear overlap smooths mismatched boundaries without scheduling
restarts. This shortens the selected loop by the overlap duration. Use zero for
already seamless loops or rhythmically exact material. Use deliberate bounds and
listen to the result for tempo-sensitive files: automatic trimming is not a
substitute for audio editing.

The resulting buffer runs on one AudioBufferSourceNode with `loop`, `loopStart`,
and `loopEnd`. An initial gain ramp avoids a hard start. No timer restarts playback.
The loop preparation lives separately in `src/core/audio/loop.ts`, so its overlap
method can change without altering the transport or controls.
