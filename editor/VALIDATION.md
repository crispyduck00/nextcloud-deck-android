# Verification status — 2026-11-01

Validated implementation commit: `99397ae012ab005bdac043b0c01fc734ea011adb`.
Base: upstream `stefan-niedermann/nextcloud-deck`, master commit
`04f68739bd701b37d126b60048f257f4da6fd921`.

## Completed

- 28 Node/jsdom tests and 8 browser integration tests passed both locally and
  in the fork's `Visual description editor` GitHub Actions workflow.
- The generated offline assets rebuild without drift. Dependencies are
  lockfile-pinned and complete third-party license texts ship in the APK.
- Verified checklist creation without syntax, Enter continuation, visual checkbox
  toggling, nested checklists, bold, undo, mode switching, source-only edits,
  current-content Apply/Close bridge responses, attachment-link retention, and
  unchanged Markdown byte preservation.
- Unsupported HTML/script content remains literal source; no remote image or
  link navigation request occurs in the browser tests.
- Inspected the actual 360px dark editor rendering and corrected checkbox row
  styling; a regression assertion checks checkbox/text alignment.
- Native Java compilation and the dev APK build passed in Android CI run
  `41307554292`. The existing Android unit-test job passed on its retry after
  the first attempt hit a Maven Central HTTP 429 dependency-download limit.
- The existing Gradle wrapper validation and CodeQL scan passed. The upstream
  lint job also passed; its `lintDebug` command targets the two library modules,
  so it must not be treated as an app-specific Android lint result.
- Downloaded APK integrity and its v2 debug signature were verified. All four
  bundled visual-editor assets match the committed source build byte-for-byte.
- APK application ID: `it.niedermann.nextcloud.deck.dev`, version `1.27.0`.
  It can coexist with the regular app. It is signed with a test/debug key.
- APK SHA-256: `c9f9df420e8c3099b0b0f5472c0d8aece6ab7bb73a73b369c9a4a22f7795728f`.
- Changed Android XML files parse successfully. The patch applies cleanly to
  the upstream base, and `git diff --check` passes.

[Test APK artifact](https://github.com/crispyduck00/nextcloud-deck-android/actions/runs/41307554292/artifacts/13083623506)

## Still to verify on Android

The APK has not been run on a physical device or emulator. There is no Android
instrumentation result for the new dialog's lifecycle, keyboard/IME composition,
SSO/offline synchronization, accessibility or device performance. Browser tests
and the existing native unit suite do not substitute for these acceptance checks.

Complete the device checklist in `editor/README.md` and run
`./gradlew :app:lintDevDebug` before a release. The pull request remains a draft
and the APK is an experimental test build. No merge or production release has
been performed.

The local build environment originally stopped before compilation at SDK
prerequisites; the successful GitHub Actions build supersedes that limitation.
