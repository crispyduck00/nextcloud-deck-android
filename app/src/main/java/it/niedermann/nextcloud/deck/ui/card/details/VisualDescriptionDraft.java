// SPDX-License-Identifier: GPL-3.0-or-later
package it.niedermann.nextcloud.deck.ui.card.details;

import androidx.lifecycle.ViewModel;

/** Dialog-local draft. It must never write to the card before Apply. */
public class VisualDescriptionDraft extends ViewModel {
    String original;
    String markdown;
    boolean sourceMode;
}
