# Deck Fork

Deck Fork is an independent community fork maintained in
[`crispyduck00/nextcloud-deck-android`](https://github.com/crispyduck00/nextcloud-deck-android).
It is based on [`stefan-niedermann/nextcloud-deck`](https://github.com/stefan-niedermann/nextcloud-deck),
commit `04f68739bd701b37d126b60048f257f4da6fd921`.
It is not an official Nextcloud product and is not endorsed by the upstream
maintainers. Nextcloud is a trademark of Nextcloud GmbH.

## Changes dated 2026-11-01

- Optional offline visual Markdown editing of card descriptions, including
  checklist creation, formatting controls, undo/redo and a source fallback.
- A checklist-counter shortcut to the description in preview mode.
- Deck Fork app name and FORK launcher badge, an in-app fork notice, and links
  to this fork's source and issue tracker. Original developer and icon credits
  remain in the app and repository history.
- Editor tests and reproducible bundled assets; app-specific lint in Android CI.

The app is a community preview, with verification and remaining device checks
documented in [editor/VALIDATION.md](editor/VALIDATION.md). The `dev` Gradle flavor
and `.dev` package suffix are retained for update compatibility with the preview
APKs. They are implementation identifiers; the visible app name is Deck Fork.

## License and redistribution

The project remains **GPL-3.0-or-later**, as stated in the upstream README and
source notices. [LICENSE](LICENSE) contains the unchanged GPLv3 text. Original
copyrights are retained; the fork does not claim ownership of upstream work.
Bundled editor dependency licenses are included in
[`THIRD_PARTY_NOTICES.txt`](app/src/main/assets/visual-editor/THIRD_PARTY_NOTICES.txt).

The GPL permits modified versions under its conditions. When distributing this
fork, retain the license and legal notices, identify modifications and their
date, license the covered work under the GPL, and provide the corresponding
machine-readable source (including build scripts) as required by GPLv3 sections
4–6. For an APK download, provide an equally accessible link to the matching
source commit/archive, not merely an unversioned link to a moving branch.
Recipients may build, modify and redistribute the covered work under the GPL.

Copyright permission and trademark permission are separate. The name **Deck
Fork**, FORK badge and independent-fork notice distinguish this app from the
original; compatibility references and original attribution remain. No
permission or endorsement by Nextcloud GmbH is claimed. This is not an app-store
publication or a representation that store-specific requirements are complete.

Primary references checked on 2026-11-01:

- [Upstream license statement](https://github.com/stefan-niedermann/nextcloud-deck/blob/04f68739bd701b37d126b60048f257f4da6fd921/README.md#-license).
- [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.html), especially sections 4–7.
- [Nextcloud trademark guidelines](https://nextcloud.com/trademarks/), especially
  “Apps, product and service names and compatibility references”.
