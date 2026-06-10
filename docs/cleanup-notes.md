# Cleanup Notes

## Completed cleanup

- Added local PostgreSQL/Prisma setup and initial migration.
- Replaced hardcoded client API host with `NEXT_PUBLIC_SERVER_URL`.
- Added example environment files for client and server.
- Cleaned Socket.IO server configuration and CORS origin handling.
- Fixed Zego token response handling to avoid double responses.
- Added upload directory auto-creation on server startup.
- Removed unused server dependencies:
  - `mongoose`
  - `@types/mongoose`
  - `firebase-admin`
  - npm `crypto`
- Upgraded server dev tooling:
  - `nodemon`
- Upgraded client dependencies:
  - `next`
  - `firebase`
- Removed several temporary debug logs.
- Confirmed core app flows:
  - Google login
  - contact loading
  - real-time text messages
  - image messages
  - audio messages
  - message persistence after refresh

## Current dependency audit status

- Server audit: 0 vulnerabilities.
- Client audit: reduced from 11 vulnerabilities to 5 vulnerabilities.

Remaining client audit items are related to:
- Next.js/PostCSS advisories that require a major Next.js upgrade.
- Zego/protobuf advisories that require a major Zego SDK upgrade.

These upgrades are intentionally deferred because they may require a larger migration and retesting of the call feature.

## Deferred cleanup items

- Remove remaining audio/call debug logs:
  - `client/src/components/common/CaptureAudio.jsx`
  - `client/src/components/common/IncomingCall.jsx`
  - `client/src/components/common/IncomingVideoCall.jsx`
  - `client/src/components/Call/Container.jsx`
- Add stronger upload validation for image/audio files.
- Add stronger authentication/authorization checks on backend routes.
- Consider a larger Next.js major-version upgrade after the app is fully stable.
- Consider a Zego SDK major-version upgrade after call functionality is retested.
