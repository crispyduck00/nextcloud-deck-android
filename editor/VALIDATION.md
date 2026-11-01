# Verification status — 2026-11-01

## Deck Fork branding update

The working editor and checklist shortcut have been reported working on the
user's Android device. The fork is being promoted to the default branch with
the app name **Deck Fork**, a **FORK** launcher badge, fork-specific source and
issue links, and a prominent independent-fork notice. Build version:
`1.27.0-fork.1`, version code `1027002`; `.dev` package identity is retained.
The current build and app-specific lint results will be recorded here once
complete. The previously verified editor build is documented below.

## Previous preview 0.2

Validated implementation commit: `6e33860cf09f5dbeeeac88129318179d55d2efb1`.
Test build: `1.27.0-visual.2` (version code `1027001`).
Base: upstream `stefan-niedermann/nextcloud-deck`, master commit
`04f68739bd701b37d126b60048f257f4da6fd921`.

## Completed

- 28 editor-source tests and 8 browser integration tests passed locally and in
  GitHub Actions (`Visual description editor`, run `41309894260`).
- The fast-typing checklist case also passed 20 local repetitions after fixing
  a delayed toolbar-focus selection race. Toolbar and link controls now focus
  the editor synchronously before applying commands.
- Native Java compilation, dev APK build and the full existing Android debug
  unit suite passed in Android CI run `41309894210`, across dev/fdroid/mdm/
  pfungstadt/play variants.
- New native regression cases cover counter vs ordinary card navigation, a
  recycled counter opening the correct card, selection-mode behavior, the
  temporary preview override, unchanged saved preferences, consuming the scroll
  request, and switching back to Markdown. The ViewModel cases run under the
  upstream API 24/35 configuration; adapter UI cases use API 35.
- CodeQL and Gradle wrapper validation passed. The upstream lint job passed for
  its configured library-module targets; it does not invoke app-specific lint.
- Offline assets rebuild without drift. Complete third-party licenses ship in
  the APK. All four bundled visual-editor assets match the committed build.
- Downloaded CI archive SHA-256 and ZIP integrity were verified. The directly
  supplied test APK was then signed with a retained private development key.
  Its v2 signature, `.dev` package ID, version and unchanged payload were verified.
- The initial visual-editor build and subsequent counter shortcut were reported
  working on the user's Android device. Broader device acceptance remains below.

## Direct test APK

- Application ID: `it.niedermann.nextcloud.deck.dev`.
- Version: `1.27.0-visual.2`; version code: `1027001`.
- SHA-256: `0799e50cd2d2923549a9f335b10db7ef1033561d528c50285ac166d3fa032498`.
- Signing certificate SHA-256: `31ba696f741629f5da85043eaa76055d60f2755922c1db9b1840695b9d341412`.
- CI source artifact: [app-dev-debug](https://github.com/crispyduck00/nextcloud-deck-android/actions/runs/41309894210/artifacts/13084952918).

The direct APK uses a retained private test key kept outside this repository.
CI artifacts use runner-generated debug keys and have a different signature.
The initial 0.1 test APK must be uninstalled once after syncing pending changes;
subsequent directly supplied builds can reuse the retained key for updates.
This key is for experimental `.dev` builds, not production releases.

## Still to verify

On Android, tap the checklist counter on a board and in Upcoming. Confirm that
Details opens at the description in preview, the keyboard stays closed, boxes
can be ticked and saved, and a normal card tap retains its previous default mode.
Also check rotation, returning from other tabs, readonly boards, accessibility
and SSO/offline sync. These scroll/focus and system-keyboard checks have not been
run as Android instrumentation tests.

Complete the device checklist in `editor/README.md` and run
`./gradlew :app:lintDevDebug` before a release. The PR remains a draft; no merge
or production release has been performed.
