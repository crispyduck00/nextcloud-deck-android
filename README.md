# Deck Fork for Android

[![Android CI](https://github.com/crispyduck00/nextcloud-deck-android/actions/workflows/android.yml/badge.svg)](https://github.com/crispyduck00/nextcloud-deck-android/actions/workflows/android.yml)
[![GitHub issues](https://img.shields.io/github/issues/crispyduck00/nextcloud-deck-android.svg)](https://github.com/crispyduck00/nextcloud-deck-android/issues)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

An independent community fork of [Deck for Android by Stefan Niedermann and
contributors](https://github.com/stefan-niedermann/nextcloud-deck), compatible
with the [Nextcloud Deck server app](https://github.com/nextcloud/deck/).
Maintained here by **crispyduck00**. This fork is not affiliated with or endorsed
by Nextcloud GmbH or the upstream maintainers.

The fork adds an **offline visual description editor** with checklist controls
and a Markdown source mode. Tapping a card's checklist counter opens its
description directly in preview, ready to tick boxes. See
[editor/README.md](editor/README.md) for usage, architecture and build instructions,
and [editor/VALIDATION.md](editor/VALIDATION.md) for the current verification status.

## Fork builds

The app is named **Deck Fork**, with **FORK** on its launcher icon. Its version
is `1.27.0-fork.1` (version code `1027002`). This is a community preview; device
acceptance checks and the current test evidence are recorded in
[editor/VALIDATION.md](editor/VALIDATION.md).

The historical Gradle flavor `dev` and application ID
`it.niedermann.nextcloud.deck.dev` are retained so existing visual-editor preview
installations can update without losing local data. Supplied APK updates reuse
the same retained private signing key as preview 0.2. CI artifact APKs use
runner-generated debug keys and cannot be used as in-place updates to those APKs.
Deck Fork can be installed alongside the original app.

Build from this repository with `./gradlew assembleDevDebug`; rebuilding the
editor requires the steps in [editor/README.md](editor/README.md). The matching
source is this repository, including the committed offline assets and their
third-party notices. APKs must be accompanied by a link to their exact source
commit when redistributed. Report fork problems in
[this repository's issue tracker](https://github.com/crispyduck00/nextcloud-deck-android/issues).

## Original app and upstream support

The links below install or support the **original upstream app**, not Deck Fork.
Its developers and contributors retain their original copyrights and credits.

[![Latest Release](https://img.shields.io/github/v/tag/stefan-niedermann/nextcloud-deck?label=latest+release&sort=semver)](https://github.com/stefan-niedermann/nextcloud-deck/releases)
[![F-Droid Release](https://img.shields.io/f-droid/v/it.niedermann.nextcloud.deck)](https://f-droid.org/de/packages/it.niedermann.nextcloud.deck/)

[<img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
      alt="Get it on Play Store"
      height="80">](https://play.google.com/store/apps/details?id=it.niedermann.nextcloud.deck.play)
[<img src="https://f-droid.org/badge/get-it-on.png"
      alt="Get it on F-Droid"
      height="80">](https://f-droid.org/repository/browse/?fdid=it.niedermann.nextcloud.deck)
[<img src="https://raw.githubusercontent.com/stefan-niedermann/paypal-donate-button/master/paypal-donate-button.png"
      alt="Donate with PayPal"
      height="80">](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ZD39ZE7MGEGBL&source=url)
[<img src="https://raw.githubusercontent.com/stefan-niedermann/DonateButtons/master/LiberaPay.png"
      alt="Donate using Liberapay"
      height="80">](https://liberapay.com/stefan-niedermann/donate)

## 👀 Screenshots

| List View | Card View |
| --- | --- |
| ![Screenshot of list view](/fastlane/metadata/android/en-US/images/phoneScreenshots/2.png) | ![Screenshot of card](/fastlane/metadata/android/en-US/images/phoneScreenshots/5.png) |

## 🚀 Features
* Multiple accounts 👥
* Works offline 🔌
* Manage cards, lists and boards 📝
* Manage tags 🏷
* Supports attachments 📎, activities ⚡ & comments 💬
* Dark mode 🌙
* Translated in many languages 🌎

## 👪 Join the team
* Test the app with different devices
* Report fork issues in the [issue tracker](https://github.com/crispyduck00/nextcloud-deck-android/issues)
* Create a [Pull Request](https://opensource.guide/how-to-contribute/#opening-a-pull-request)
* Help increasing the test coverage by contributing unit tests
* Translate the app on [Transifex](https://app.transifex.com/nextcloud/nextcloud/android-deck/)

## 🔗 Requirements
* [Nextcloud](https://nextcloud.com/) instance running
* [Nextcloud Android](https://github.com/nextcloud/android) app installed (≥ 3.9.0)
* [Nextcloud Deck](https://github.com/nextcloud/deck) app enabled (≥ 0.6.4)

## 📓 License
All contributions to this repository are considered to be licensed under the [GNU GENERAL PUBLIC LICENSE 3+](/LICENSE).

Fork modifications dated **2026-11-01** include the visual editor, direct
checklist preview, fork branding and build/documentation changes. See
[FORK.md](FORK.md) for provenance, redistribution and branding information.
The original license and copyright notices are retained. The GPL does not grant
rights to use Nextcloud trademarks; the app identifies itself as Deck Fork.

Contributors to the Deck Android app retain their copyright. Therefore we recommend to add following line to the header of a file, if you changed it substantially:

```
@copyright Copyright (c) <year>, <your name> (<your email address>)
```
