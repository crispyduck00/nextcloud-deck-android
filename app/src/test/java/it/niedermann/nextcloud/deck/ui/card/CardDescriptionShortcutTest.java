// SPDX-License-Identifier: GPL-3.0-or-later
package it.niedermann.nextcloud.deck.ui.card;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.robolectric.Shadows.shadowOf;

import android.app.Application;
import android.graphics.Color;
import android.os.Bundle;
import android.widget.FrameLayout;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.preference.PreferenceManager;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.util.ArrayList;
import java.util.List;

import it.niedermann.nextcloud.deck.R;
import it.niedermann.nextcloud.deck.model.Account;
import it.niedermann.nextcloud.deck.model.Board;
import it.niedermann.nextcloud.deck.model.Card;
import it.niedermann.nextcloud.deck.model.full.FullBoard;
import it.niedermann.nextcloud.deck.model.full.FullCard;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 35, application = Application.class)
public class CardDescriptionShortcutTest {
    public static class TestActivity extends AppCompatActivity {
        @Override
        protected void onCreate(@Nullable Bundle savedInstanceState) {
            setTheme(R.style.AppTheme);
            super.onCreate(savedInstanceState);
        }
    }

    private FullCard checklist(long id) {
        final var card = new FullCard();
        card.setCard(new Card("Checklist", "- [ ] First\n- [x] Second", 1));
        card.getCard().setLocalId(id);
        card.setAttachments(new ArrayList<>());
        return card;
    }

    private CardAdapter adapter(TestActivity activity, FullCard card, @Nullable SelectCardListener selection) {
        PreferenceManager.getDefaultSharedPreferences(activity).edit()
                .putBoolean(activity.getString(R.string.pref_key_compact), false)
                .putBoolean(activity.getString(R.string.pref_key_cover_images), false).commit();
        final var account = new Account();
        account.setId(1L);
        account.setName("test");
        account.setUserName("test");
        final var board = new FullBoard();
        board.setBoard(new Board("Board", Color.BLUE));
        board.getBoard().setId(30L);
        board.getBoard().setLocalId(3L);
        board.getBoard().setPermissionEdit(true);
        final var adapter = new CardAdapter(activity, mock(CardActionListener.class), selection);
        adapter.setAccount(account);
        adapter.setFullBoard(board);
        adapter.setCardList(List.of(card), Color.BLUE);
        return adapter;
    }

    @Test
    public void counterOpensPreviewWhileNormalCardTapKeepsItsUsualMode() {
        try (final var controller = Robolectric.buildActivity(TestActivity.class).setup()) {
            final var activity = controller.get();
            final var card = checklist(7);
            final var adapter = adapter(activity, card, null);
            final var holder = adapter.onCreateViewHolder(new FrameLayout(activity), adapter.getItemViewType(0));
            adapter.onBindViewHolder(holder, 0);

            holder.itemView.findViewById(R.id.card_count_tasks).performClick();
            final var shortcut = shadowOf(activity).getNextStartedActivity();
            assertNotNull(shortcut);
            assertTrue(shortcut.getBooleanExtra(EditActivity.BUNDLE_KEY_DESCRIPTION_PREVIEW, false));
            assertEquals(7, shortcut.getLongExtra("cardLocalId", -1));
            assertEquals(3, shortcut.getLongExtra("boardLocalId", -1));

            holder.getDraggable().performClick();
            final var normal = shadowOf(activity).getNextStartedActivity();
            assertFalse(normal.getBooleanExtra(EditActivity.BUNDLE_KEY_DESCRIPTION_PREVIEW, false));
        }
    }

    @Test
    public void recycledCounterUsesTheNewCardAndIsDisabledInSelectionMode() {
        try (final var controller = Robolectric.buildActivity(TestActivity.class).setup()) {
            final var activity = controller.get();
            final var first = checklist(7);
            final var adapter = adapter(activity, first, null);
            final var holder = adapter.onCreateViewHolder(new FrameLayout(activity), adapter.getItemViewType(0));
            adapter.onBindViewHolder(holder, 0);

            final var second = checklist(9);
            adapter.setCardList(List.of(second), Color.BLUE);
            adapter.onBindViewHolder(holder, 0);
            holder.itemView.findViewById(R.id.card_count_tasks).performClick();
            assertEquals(9, shadowOf(activity).getNextStartedActivity().getLongExtra("cardLocalId", -1));

            final var selection = mock(SelectCardListener.class);
            final var selectionAdapter = adapter(activity, second, selection);
            selectionAdapter.onBindViewHolder(holder, 0);
            final var counter = holder.itemView.findViewById(R.id.card_count_tasks);
            assertFalse(counter.hasOnClickListeners());
            assertFalse(counter.isClickable());
            holder.getDraggable().performClick();
            verify(selection).onCardSelected(second, 3L);
        }
    }
}
