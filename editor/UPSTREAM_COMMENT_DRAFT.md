# Upstream comment draft — not posted

Suggested destination: existing issue
[#1745, WYSIWYG editor for card descriptions](https://github.com/stefan-niedermann/nextcloud-deck/issues/1745).
It was closed with `wontfix`; the maintainer cited maintenance and performance
concerns. A short update with working code is more appropriate than a duplicate
feature request. Upstream Discussions were disabled when checked on 2026-11-01.

---

Thanks for explaining the maintenance and performance concerns. I have put
together an optional visual description editor in a community fork and wanted
to share the working prototype here rather than open a duplicate request:

https://github.com/crispyduck00/nextcloud-deck-android/pull/1

It adds checklist/list/formatting buttons without requiring Markdown syntax.
The existing editor and preview remain available, descriptions remain Markdown,
and saving/syncing use the existing Deck flow. Tiptap/ProseMirror is bundled
locally in an isolated Android WebView, with no runtime network dependency.
Unsupported or lossy Markdown falls back to source mode; unchanged descriptions
keep their original bytes. Images currently use placeholders.

There is also a smaller, independent usability change: tapping the checklist
counter (e.g. 2/5) opens the description directly in preview, without changing
the saved default mode, so checkboxes can be ticked quickly.

The prototype has editor/browser and Android regression tests, and has been
tried successfully on an Android device. Broader keyboard, accessibility and
device testing is still needed; it is not a claim of production readiness.

Would either approach be of interest for upstream consideration, potentially
as separate changes? I understand if a visual editor remains outside the
project's maintenance scope. Fork branding is separate from the feature work.
