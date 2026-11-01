# Verification status — 2026-11-01

## Deck Fork 1.27.0-fork.1

Validated executable/source commit:
[`73196a83116af5c5cf8c24b431f8b121746b11fa`](https://github.com/crispyduck00/nextcloud-deck-android/tree/73196a83116af5c5cf8c24b431f8b121746b11fa).
Later documentation-only changes do not change the tested APK payload.

The app is named **Deck Fork**, with **FORK** on adaptive, monochrome and legacy
launcher icons. About identifies the independent community fork, preserves
upstream credits, and links to the fork's source, license and issue tracker.
The editor and checklist shortcut were reported working on an Android device.
The fork remains a **community preview**, with broader device acceptance below.

### Completed checks

- Android CI run `41312037437`: native compilation/APK generation, wrapper
  validation and unit tests across all five existing debug flavors passed.
- Visual-editor CI run `41312037403`: 28 source tests and 8 browser tests passed;
  committed offline assets rebuilt without drift.
- CodeQL run `41312037436`: build and analysis passed.
- App-specific `:app:lintDevDebug` and both library lint targets completed.
  **This is not a clean lint result:** the upstream `abortOnError false` setting
  allows the job to succeed with findings. The app report contains **76 errors
  and 262 warnings**. None of the error locations intersect lines added or
  changed by the fork relative to upstream `04f6873`; no errors point to the new
  visual editor/dialog classes. This is a source-line comparison, not a separate
  baseline build. Most errors concern existing translation format/plural issues;
  the remainder concern existing lifecycle, permissions, thread and cursor code.
  One new branding warning treats the ISO date's hyphens as typography dashes.
  [Full lint report artifact](https://github.com/crispyduck00/nextcloud-deck-android/actions/runs/41312037437/artifacts/13085434071).
- XML/YAML and all icon exports parse correctly. Adaptive/monochrome and legacy
  artwork share the same outlined geometry; legacy PNG pixels in the APK match
  the committed exports.
- Downloaded CI ZIP digest and integrity verified. The direct APK's v2/v3
  signatures verify with the retained key from preview 0.2. Every non-signature
  payload file matches the CI APK, and all four editor assets match source.
- Compiled APK resources identify **Deck Fork**, include the English/German fork
  notices, and point source/issues to this fork.

### Direct APK and update identity

- File: `Deck_Fork_1.27.0-fork.1.apk`.
- Version: `1.27.0-fork.1`; code: `1027002`.
- Package: `it.niedermann.nextcloud.deck.dev` (retained for update compatibility).
- SHA-256: `b91d8a2114455f5c392d0ec1fbe339bfdd5b877b743fcf6b684aaf3c6059d615`.
- Signing certificate SHA-256: `31ba696f741629f5da85043eaa76055d60f2755922c1db9b1840695b9d341412`.
- [CI source APK artifact](https://github.com/crispyduck00/nextcloud-deck-android/actions/runs/41312037437/artifacts/13086025884)
  (archive SHA-256 `59ab12f0ad205f95d63967ad0a65eae3e934fd8e9d415c403a00eafbaab2db0e`).

The directly supplied APK can update the signed preview 0.2 without uninstalling.
The CI artifact itself has a different runner-generated signature. The retained
private key stays outside the public repository. Version 0.1 used a lost runner
debug key and requires the previously documented one-time reinstall.

Before a production release, address/review the app lint findings and complete
the device acceptance checklist. Establishing the fork does not imply a store
publication or upstream endorsement. An unposted comment draft for the existing
upstream feature request is in `editor/UPSTREAM_COMMENT_DRAFT.md`.

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

At the preview 0.2 checkpoint the PR was a draft and app-specific lint had not
yet run. See the Deck Fork section above for the current results and remaining
production-release checks.
