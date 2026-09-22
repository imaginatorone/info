# Sound asset brief

The site audio should feel like one restrained audiovisual instrument, not a game UI sound pack. Keep every sample dry enough to layer without smearing the interface. The website owns final gain.

## Export baseline

- WAV, 48 kHz, 24-bit.
- Stereo where space matters, mono is fine for tiny UI clicks.
- No normalization.
- Leave at least 6 dBFS true-peak headroom.
- Do not hard-limit the samples.
- Dither is not needed for 24-bit export.
- Keep filenames exactly as listed below.

## 1. ambience-loop.wav

Purpose: continuous background atmosphere after the user presses entry.

Target length: 24-45 seconds.

Character:

- dark air / room / low electrical texture
- extremely slow motion
- tiny distant grains are fine
- very little tonal information
- no obvious beat
- no obvious beginning or ending
- avoid a loud sub drone because it will become tiring on headphones
- avoid a bright hiss that competes with the glyph visuals

Suggested source loudness:

- roughly -24 to -20 LUFS integrated
- true peak around -8 to -6 dBFS

The manifest runs it at gain 0.25 before the site master.

### Safest seamless Ableton workflow

1. Build a loop region that already sounds continuous.
2. Duplicate it at least three times on the timeline.
3. Let reverbs, delays, granular effects and modulation run continuously across all three copies.
4. Resample or export the continuous result.
5. Cut the middle complete cycle, not the first or last cycle.
6. Make sure Warp is off for the final file unless the effect deliberately depends on it.
7. Do not add a fade-to-silence at either boundary.
8. Export that middle cycle as ambience-loop.wav.

This gives the file matching ambience at both boundaries instead of a reverb tail that exists only at the end.

The browser also protects the seam:

- trimSilence removes exported silent head/tail samples
- an 80 ms preparation crossfade is enabled by default
- playback uses one looping AudioBufferSourceNode, not timer-based restarts

If your rendered loop is already sample-perfect, set crossfadeSeconds to 0 later.

## 2. ui-press.wav

Purpose: pressing the central entry target.

Target length: 70-140 ms.

Character:

- tactile mechanical/digital click
- a tiny low transient or body
- restrained high-frequency grain
- immediate attack
- no long reverb tail

Think "physical switch inside a strange old digital object", not a menu click.

Suggested peak: around -8 dBFS.

## 3. ui-hover.wav

Purpose: sparse nav hover/focus feedback.

Target length: 20-55 ms.

Character:

- very small tick, grain or soft relay
- no bass
- no piercing 5-10 kHz spike
- nearly disposable on its own

It will play quietly and is rate-limited, so do not make it attention-grabbing.

Suggested peak: around -12 to -9 dBFS.

## 4. reveal.wav

Purpose: the entry rupture and reconstruction into the first readable site state.

Target length: 0.8-1.5 seconds.

Character:

- short air pull / digital collapse / reconstruction
- one subtle low body is fine
- a reversed texture into a short impact works well
- optionally a very restrained tonal interval
- the tail may be atmospheric, but should not mask the first seconds of the site

This is the largest authored sound in the set.

Suggested peak: around -8 to -6 dBFS.

## 5. route.wav

Purpose: switching home / about / code / sound / links.

Target length: 160-320 ms.

Character:

- short sync tear
- raster displacement
- tape/data scrape
- tiny filtered transient
- optionally a small pitch movement, but no obvious musical note every time

It should match the visual row tear and particle disturbance, not sound like a browser tab click.

Suggested peak: around -10 to -8 dBFS.

## 6. toggle.wav

Purpose: mute and unmute.

Target length: 45-90 ms.

Character:

- dry tiny latch
- relay
- contact click
- soft binary tick

No reverb. No bass. It needs to remain intelligible even at low site volume.

Suggested peak: around -12 to -9 dBFS.

## Recommended first delivery

Put these files in public/audio/:

- ambience-loop.wav
- ui-press.wav
- ui-hover.wav
- reveal.wav
- route.wav
- toggle.wav

Then set the matching src values in public/audio/manifest.json. The code already has independent buses/slots for all six.

## What not to make yet

Do not create a sound for every particle or pointer movement. Constant micro-sonification becomes exhausting quickly. If the first six assets work, later additions can be rare event sounds such as a one-shot severe glitch or a SoundCloud-specific transition.
