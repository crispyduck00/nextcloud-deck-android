# Verification status — 2026-11-01

Base: upstream `stefan-niedermann/nextcloud-deck`, master commit
`04f68739bd701b37d126b60048f257f4da6fd921`.

## Completed

- 28 Node/jsdom tests passed against the editor source (`npm test`).
- 8 browser integration tests passed against the exact generated offline assets
  in Chromium 138, using touch and 412px/360px viewports.
- Verified checklist creation without syntax, Enter continuation, visual checkbox
  toggling, nested checklists, bold, undo, mode switching, source-only edits,
  current-content Apply/Close bridge responses, attachment-link retention, and
  unchanged Markdown byte preservation.
- Unsupported HTML/script content remains literal source; no remote image or
  link navigation request occurs in the browser tests.
- Inspected the actual 360px dark editor rendering and corrected checkbox row
  styling; a regression assertion checks checkbox/text alignment.
- Offline bundle builds successfully; dependencies are lockfile-pinned and
  third-party license texts are included in the Android assets.
- Changed Android XML files parse successfully. `git diff --check` passes.

## Not completed

The native Android code has **not been compiled or run on a device** yet.
The attempted `:app:assembleDevDebug` build reached Android SDK setup and stopped
before compilation because the environment did not have the required licensed
SDK packages recognized/accepted. No SDK license acceptance was performed.

Consequently there is no verified APK, native lifecycle test, SSO/sync test,
Android IME/composition test or device performance result at this stage. The
browser tests do not substitute for these checks. Run the upstream Android CI
in the fork or build in an Android development environment with the required
SDK packages already installed and licensed, then complete the acceptance list
in `editor/README.md` before a release.

The additional `Visual description editor` CI workflow rebuilds the assets and
runs both JavaScript test suites. Existing Android CI remains responsible for
native lint, unit tests and APK generation.
