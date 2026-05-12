# SportsFixtures PWA Google/Apple readiness review

Date: 2026-05-06

## Official baseline checked

- Chrome/web.dev installability: HTTPS, valid manifest, name or short name, 192 and 512 icons, start URL, valid display mode, service worker, and `prefer_related_applications` not forced true.
- Apple Safari web apps: standalone/full-screen mode still depends on Apple-specific meta tags such as `apple-mobile-web-app-capable`, app title, and status bar style.
- MDN manifest reference: manifest should be linked from the document head and define install appearance through members such as `start_url`, `scope`, `display`, icons, theme color, and background color.

## Current status

### Pass

- Manifest linked from root metadata.
- Service worker registered at `/sw.js` with root scope.
- 192, 512, and Apple 180 icons exist in `public`.
- Viewport uses `width=device-width`, `initialScale=1`, and `viewportFit=cover`.
- App has bottom navigation and internal back/navigation surfaces, so standalone mode is usable.
- Push notification click/open tracking exists.
- Offline fallback exists.

### Fixed in this pass

- Added manifest `id`, `scope`, `description`, `lang`, `dir`, `display_override`, `orientation`, `categories`, and explicit `prefer_related_applications: false`.
- Changed `short_name` to `SportsFix` so Android/iOS launcher labels are less likely to truncate badly.
- Marked main icons as `any maskable` for Android adaptive icon handling.
- Added manifest shortcuts for Live Scores, Fixtures, and Places to Watch.
- Added extra mobile/PWA meta hints for Apple and Android web app capability.
- Changed iOS status bar style to `black-translucent` to work better with `viewport-fit=cover`.
- Added safe-area padding to bottom nav and fixed bottom prompts.
- Added global horizontal overflow protection and text-size adjustment protection.
- Bumped service worker cache name and call `skipWaiting()` on install so stale shells update faster.

## Production deployment requirements

- Serve `https://app1.sportsfixtures.net` over HTTPS with a valid certificate.
- Serve `/manifest.webmanifest` with `Content-Type: application/manifest+json` or valid JSON content type.
- Serve `/sw.js` from the origin root with no CDN rewrite that changes scope.
- Confirm `Service-Worker-Allowed: /` is present if any CDN path handling changes.
- Do not cache API responses in the service worker. Live data should remain app/API controlled.
- Keep `prefer_related_applications` false unless a native app becomes the preferred install path.
- Validate installability in Chrome DevTools Application > Manifest and Application > Service Workers.
- Validate on real devices: iPhone Safari Add to Home Screen, Android Chrome install prompt, iPad portrait/landscape, small Android 360px width, desktop PWA window.

## Remaining recommended assets

- Create true maskable icons with safe padding rather than reusing the normal icon.
- Add app-store-quality screenshots to the manifest once final mobile screens are locked.
- Add Apple startup images only if the launch flash/splash experience needs finer control on iOS.

