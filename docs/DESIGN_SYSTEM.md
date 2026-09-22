# Design system

## Palette

Use near-black rather than absolute black for most surfaces. Primary text is warm/off-white. Secondary signal layers are neutral grays. Electric blue is a sparse interaction/accent state.

## Typography

Use a high-quality monospace face for signal/UI/meta text and a restrained grotesk or system sans for human prose. Do not make every line look like a terminal.

## Spatial language

Large negative space, asymmetric crops, full-bleed signal scenes, and unframed sections. Avoid stacking floating cards.

## Signal states

1. FIELD - calm procedural particles/glyphs.
2. FIGURE - partial silhouette or image reconstructed as points/dither.
3. GRID - glyph/ASCII topology for code and repository content.
4. WAVE - audio-responsive, flowing structures for sound.

## Image state pipeline

Raster/image → grayscale/luminance → ordered/error-diffusion dither → glyph density → particles → reconstruction.

## Glitch policy

Glitch only marks state change, impact, navigation, or a deliberate failure/recovery beat. It should be short, legible, and followed by visual calm.

## Responsive rule

Preserve concept, not pixel-for-pixel layout. Density, cell size, post-processing, and motion amplitude may adapt while hierarchy and identity remain intact.
