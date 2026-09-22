# Data integrations

## GitHub

Primary: https://github.com/imaginatorone
Secondary: https://github.com/sensorywave

Public browser fetches may use the GitHub REST user/repository endpoints for avatar, bio, public repo counts, followers, and selected repository metadata.

Do not render every repository automatically. Featured repositories are curated in local config, then enriched with live public metadata.

A live GitHub user status requires authenticated GraphQL access. Put that behind a serverless endpoint with the token stored as a secret; never ship it to the browser. Cache responses and provide graceful stale/fallback data.

## SoundCloud

Use a site-owned visual list/player surface. Resolve embeds lazily through SoundCloud oEmbed when the visitor requests playback or opens a track. Do not let the default orange widget define the page.

The exact SoundCloud profile URL is intentionally not guessed here; add it to site config once confirmed.

## Social

Telegram: https://t.me/imaginatorone
YouTube: https://www.youtube.com/@1maginatorone

All external identities belong in one typed configuration module so URLs and labels are not duplicated across components.
