# Roadmap

## M0 - foundation

Status: complete.
Project architecture, design/data/audio/performance notes, build tooling, tests, and a clean React shell are in place.

## M1 - entry scene

Status: Home composition accepted by the user as the baseline on 2026-09-22. Entry/world/localization pass implemented and verified locally.

The rejected point-cloud/ribbon composition has been replaced with an ASCII-first scene:

- two depth-separated glyph sheets use 4x4 ordered dithering and density-driven glyph selection
- the supplied character line art is rebuilt as a separate glyph contour field with its own depth and pointer parallax
- 1maginator is reconstructed from a sampled text mask made of many glyph cells instead of a DOM title fade
- short row displacement, glyph substitution, dither disruption, and a cold-blue pulse are limited to transition events
- desktop and mobile use different safe zones so character, title, navigation, and sound controls do not occupy the same region

Entry starts after renderer/atlas/target preparation, fonts and audio-manifest readiness. A localized TUI grid dissolves through the same glyph population before the semantic target appears. Repeat-session and reduced-motion intros are shorter. PRESS assembles after 1.9 seconds and persists through pointer/touch activity until entry. AudioContext remains gesture-gated.

The sound control is now one ASCII/signal control with a 44px hit area, click-to-set, pointer capture drag, touch, keyboard arrows, Home/End, independent remembered mute/volume, and smooth master-gain ramps.

## World + RU/EN pass - verified 2026-09-22

The accepted Home composition remains. Its title now has varied glyph density, small baseline offsets and a local pointer/tap response. One persistent renderer interpolates the same population into spring tree/valley, sunset meadow, moonlit field and sparse twilight targets. No reference bitmap backgrounds are used. Mobile has separate text-safe regions and landscape placement.

A typed English/Russian dictionary supplies navigation, controls, intro status and the exact supplied About paragraphs. System language selects the initial locale; an explicit choice persists and updates `html.lang` without reload. Existing audio buses, real gain control, looping workflow and safe external tabs remain intact.

Verified locally:

- Chrome at desktop 1440x900 and mobile emulation 390x844: all five routes, Home composition, English/Russian About, navigation/language/audio separation, readable glyphs and distinct route palettes
- inspected loading, TUI, dissolve, persistent PRESS, press/reconstruction, local pointer response and reduced-motion states; refined the moon density and mobile canopy/text clearance after screenshot review
- browser tests cover keyboard focus, touch entry and swipe hint persistence, gesture-gated audio, remembered mute/volume, prepared ambience loop boundaries, renderer failure fallback, safe external tabs, locale detection/persistence/live switching, and the same canvas across all route changes
- no console/page errors in route captures or the final interaction/performance capture
- settled Sound scene desktop sample: 230 measured frames after warmup, median 16.7ms and p95 16.7ms; this is local Chrome frame cadence, not a cross-device GPU benchmark
- `npm run typecheck`, `npm run lint`, `npm run test:run` (8 tests), `npm run build`, and `npm run test:e2e` (34 desktop/mobile tests) passed

The first visit holds the terminal long enough to read, about 7.6 seconds, with a skip control. Repeat visits and reduced motion are shorter. Section names stay English in both languages. Switching language sweeps the field and settles the copy. The About footer line and the old links label are gone.

Concrete limits: final authored audio is still absent; no simulated audio reactivity is added. Mobile checks use Chrome emulation, not physical iOS/Android devices. Vite still reports the existing large-bundle warning (about 294 kB gzip JavaScript).

## Publish

`main` is on https://github.com/imaginatorone/info. GitHub Pages is set to build with the repository workflow and the intended address is https://imaginatorone.github.io/info/. The first Actions run did not start: GitHub reported that the account is locked because of a billing issue, so the live address is not serving this build yet.

## M2 - persistent world + routing

Status: route world states and shared-population morphing implemented and locally verified.

The four route fields keep a stable silhouette and move the light, wind, and a small living layer: petals over the tree, warm motes on the sunset field, fireflies under the moon, and slow dust in the twilight field. Long pages scroll inside the shell so the navigation and sound control stay on screen.

## M3 - code

Status: public profiles implemented and checked locally on 2026-09-22.

`code` loads imaginatorone and sensorywave from the public GitHub API, shows recent non-fork repositories, caches the snapshot in local storage, refreshes every 10 minutes, and keeps the saved list if GitHub does not answer. A manual refresh remains available.

## M4 - sound

Status: on-site listening implemented and checked locally. A full procedural soundscape is still later work.

`sound` does not load SoundCloud until the visitor asks. The ASCII transport lists the imaginatorone tracks and supports play, pause, skip, and seek. It follows the site mute and volume. The original player can be opened on the same page. Audio still starts only from a gesture.

## M5 - polish

Adaptive quality governor, reduced-motion path, accessibility, Playwright visual QA, loading strategy, metadata, deployment, analytics/privacy decision, and final copy.

## Rule

Finish one milestone to its acceptance criteria before expanding visual scope.
