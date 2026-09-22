# imaginator.one

Personal site for 1maginator.

It brings together code, music, visual experiments, selected work, and a small interactive audiovisual layer.

## Stack

- React
- TypeScript
- Vite
- Three.js
- Motion
- Web Audio API
- Playwright
- Vitest

## Development

```bash
npm install
npm run dev
```

Checks:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run test:e2e
```

## Structure

- `src/core/render` - realtime visual layer
- `src/core/audio` - procedural sound
- `src/core/performance` - adaptive quality
- `src/content` - site content and links
- `src/services` - external data adapters
- `src/pages` - route-level content
- `src/styles` - tokens and global styles
- `docs` - design and implementation notes

The site is static-first. A small serverless endpoint may be added later only for integrations that require secrets.
