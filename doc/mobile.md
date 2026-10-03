# Mobile app (Capacitor)

The Android app wraps the same React code base in a Capacitor WebView.

## Layout

| Path                    | Role                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `src/`                  | Shared code (web + mobile)                                            |
| `capacitor.config.json` | App id `fr.calcrush.app`, `webDir: dist-mobile`, splash screen config |
| `mobileandroid/`        | Native Android project (`android.path`)                               |
| `mobileassets/`         | Icon and splash sources (`npx @capacitor/assets generate`)            |
| `.env.mobile`           | Production URLs and OneSignal app id baked into the mobile build      |

An iOS project would go to `mobileapple/` through `ios.path`.

## Builds

| Command                | Output                                                     |
| ---------------------- | ---------------------------------------------------------- |
| `npm run build`        | Web build in `dist/` (Vercel), no native code              |
| `npm run build:mobile` | Vite `mobile` mode in `dist-mobile/`                       |
| `npm run cap:sync`     | `build:mobile` + `cap sync android`                        |
| `npm run apk`          | `cap:sync` + `./gradlew assembleDebug` (needs Android SDK) |

The debug APK lands in `mobileandroid/app/build/outputs/apk/debug/app-debug.apk`.

## Web / mobile split

Native code is gated by `import.meta.env.MODE === 'mobile'`, which Vite replaces at build
time so the web bundle drops it entirely:

- `NativeAppBridge` (`App.tsx`): hides the splash screen and routes the Google login deep
  link `fr.calcrush.app://auth/callback#…` to `/auth/callback`.
- `PushRegistration` (`AppLayout.tsx`): links the device to the player in OneSignal
  (`external_id` = fastauth id).
- `AuthClient.loginWithGoogle`: opens the system browser (`?app=1`) since Google refuses
  OAuth inside a WebView.

Both components are `lazy()` loaded only in the mobile build. The `mobile` mode also drops
web-only files from `dist-mobile/` (robots, sitemap, PWA manifest, favicons, OG image) and
their `<head>` tags (see `stripWebOnlyFiles` in `vite.config.ts`).
