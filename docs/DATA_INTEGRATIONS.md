# Data integrations

## GitHub

Primary: https://github.com/imaginatorone
Secondary: https://github.com/sensorywave

Public browser fetches may use the GitHub REST user/repository endpoints for avatar, bio, public repo counts, followers, and selected repository metadata.

The Code page shows each public profile and up to four recently pushed non-fork repositories. It refreshes every ten minutes while visible, caches the last successful snapshot, and retains stale data on failure. No authenticated account status is implied.

A live GitHub user status requires authenticated GraphQL access. Put that behind a serverless endpoint with the token stored as a secret; never ship it to the browser. Cache responses and provide graceful stale/fallback data.

## SoundCloud

Use a site-owned visual list/player surface. Resolve embeds lazily through SoundCloud oEmbed when the visitor requests playback or opens a track. Do not let the default orange widget define the page.

The confirmed profile is https://soundcloud.com/imaginatorone (SoundCloud user 1415829702). Playback uses the official Widget API, loaded only after the visitor asks to load tracks. The site owns the transport and track list; the original widget remains available as a fallback. The corner mute/volume control also updates the widget.

## Social

Telegram: https://t.me/imaginatorone
YouTube: https://www.youtube.com/@1maginatorone

All external identities belong in one typed configuration module so URLs and labels are not duplicated across components.
