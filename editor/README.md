# Visual description editor (experimental)

Deck Fork adds an offline, visual Markdown editor to the **native Android
Deck app**. Open a card's details and tap **Edit visually / Visuell bearbeiten**.
The existing Markdown editor and preview remain available.

Tap a card's checklist counter (for example **2/5**) to open the details tab
directly at the description in preview mode, ready to tick checkboxes. The same
shortcut is available in Upcoming cards. This temporary mode does not change the
saved edit/preview preference; normal card taps retain their usual behavior.
Checkbox changes use the existing card Save action.

The visual editor is based on the MIT-licensed open-source Tiptap / ProseMirror
packages. It is a focused description editor, not an implementation of Obsidian
or its plugins. It has no account, subscription, CDN or runtime server dependency.

## User experience

- Write directly in formatted text. Use buttons for checklists, bullet/numbered
  lists, bold, italic, strikethrough, headings and links.
- Tap checkboxes directly. Enter continues a checklist; Enter on an empty item
  exits the list. Nested items can be indented/outdented. Undo and redo are available.
- Switch between **Visual** and **Markdown** inside the editor.
- **Apply** transfers the draft back into the card. Save the card using Deck's
  existing save action to persist/sync it. **Cancel** leaves the card unchanged
  and asks before discarding an edited draft.
- All editor resources are bundled in the APK and work offline. Drafts survive
  dialog recreation/rotation through a dialog-local ViewModel. Process-state
  restoration uses Android saved instance state, with its normal size limits.
- English and German labels, RTL direction and light/dark styling are included.

## Markdown compatibility and data preservation

The card description remains a Markdown string, using the existing Deck model,
database and sync implementation. No server extension or schema change is needed.

Opening and applying an unchanged description preserves the original string
byte-for-byte. Undoing all visual edits also restores that exact string. Actual
visual edits may normalize equivalent Markdown (e.g. `*` bullets to `-`).

Before enabling visual mode, the editor checks whether Markdown → editor JSON →
Markdown preserves rendered structure, formatting, link/image targets and code,
and whether the conversion is stable. Raw HTML, comments, reference definitions,
footnotes, or any other lossy/unsupported content stays in **Markdown** mode with
an explanation. It can still be edited and applied there. The check intentionally
prefers source mode over risking loss of existing content.

Standard headings, emphasis, code, quotes, tables, links, images and nested task
lists have round-trip tests. Images are displayed as labeled placeholders:
authenticated attachment previews and remote images are not fetched in this first
version. Their Markdown URLs are retained. Existing HTML attachment embeds stay
in source mode. The visual toolbar currently uses H2 for headings; other heading
levels can be entered in Markdown. Drag-and-drop checklist reordering and
Obsidian-style source markers on the active line are not included.

The toolbar prevents focus loss when formatting selected text. Clipboard paste
in visual mode inserts plain text, not arbitrary clipboard HTML. File/image
upload and attachment insertion continue to use Deck's existing UI outside the
dialog.

## Android integration

- `CardDetailsFragment` opens `VisualDescriptionDialog` only for editable cards.
- `VisualDescriptionDraft` holds the dialog's draft separately from the card.
- `DeckBridge.onDraft` checkpoints the editor state, but does not change the card.
- Apply requests the **current** Markdown from JavaScript, then verifies card and
  account identity, edit permission, and whether the underlying description changed.
  Conflicting content is not overwritten. The draft remains visible for copying.
- Apply then calls `EditCardViewModel.changeDescriptionFromExternal`, so the
  normal description UI, save button and offline synchronization continue to work.
- Close also reads current content before deciding whether to confirm discard.
- JavaScript callbacks are bound to the specific WebView instance, and the
  interface is removed and the WebView destroyed when the dialog view is destroyed.

The WebView serves only three bundled assets from `https://deck-editor.invalid/`.
Every other request is blocked. File/content access, network loads, image loads,
DOM storage and automatic new windows are disabled. CSP allows only local script
and CSS; raw description text is passed as JSON and never inserted into HTML.
The bridge has no filesystem, account, network, navigation or credential API.

## Rebuild and test

Prerequisites: Node 24, npm; for the APK, the upstream Android SDK/JDK requirements.

```sh
cd editor
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:browser
cd ..
./gradlew assembleDevDebug
```

`npm run build` generates `app/src/main/assets/visual-editor/`, including bundled
JavaScript and third-party license texts. The generated files are committed so
Android builds do not require Node or a runtime dependency download. CI rebuilds
them and rejects drift. Android CI builds the fork using the historical `dev`
flavor, which can be installed alongside the standard app (`.dev` application ID
suffix). Its visible name is Deck Fork and its launcher badge reads FORK. This
package identity is retained for updates from the earlier preview APKs. Directly
supplied updates reuse the retained signing key from preview 0.2; CI artifact
APKs use different runner-generated keys.

The standalone browser tests use a 412px touch viewport, plus a 360px dark-mode
case, against the exact bundled files. For a locally available compatible
Chromium, set `EDITOR_CHROMIUM_PATH`. They exercise the JavaScript side of the
same bridge protocol; they are **not Android instrumentation tests**.

## Device acceptance checks before release

- Build and install the dev APK, sign in using Nextcloud Files SSO, open an
  existing editable card, edit visually, Apply, save, and verify in the web app.
- Repeat offline, then reconnect and verify synchronization and checkbox state.
- Test Gboard and Samsung Keyboard composition, autocorrect, emoji, text selection,
  links, scrolling with the keyboard open, and the system back gesture.
- Rotate while editing in each mode; verify the draft, Cancel, Apply and no stale
  card/account callbacks. Verify a readonly board has no visual-edit action.
- Test large descriptions, HTML attachments, tables, mixed nested lists, unsupported
  syntax, minimum supported Android/WebView versions, and a WebView load failure.

Until these checks pass, this is an experimental implementation, not a release.
