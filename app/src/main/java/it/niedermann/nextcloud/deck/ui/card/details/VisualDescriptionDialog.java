// SPDX-License-Identifier: GPL-3.0-or-later
package it.niedermann.nextcloud.deck.ui.card.details;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.ComponentDialog;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.DialogFragment;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;
import java.util.Objects;

import it.niedermann.nextcloud.deck.R;
import it.niedermann.nextcloud.deck.databinding.DialogVisualDescriptionBinding;
import it.niedermann.nextcloud.deck.ui.card.EditCardViewModel;

/** Local, offline visual editor. Only an explicit Apply updates the card draft. */
public class VisualDescriptionDialog extends DialogFragment {
    public static final String TAG = "visual-description-editor";
    private static final String EDITOR_URL = "https://deck-editor.invalid/index.html";
    private static final String KEY_CARD = "card";
    private static final String KEY_ACCOUNT = "account";
    private static final String KEY_ORIGINAL = "original";
    private static final String KEY_DRAFT = "draft";
    private static final String KEY_SOURCE = "source";
    private final Handler main = new Handler(Looper.getMainLooper());
    private DialogVisualDescriptionBinding binding;
    private EditCardViewModel cardModel;
    private VisualDescriptionDraft draft;
    private boolean initialized;
    private boolean closing;
    private final Runnable loadTimeout = () -> showError(R.string.visual_editor_error);

    @NonNull
    public static VisualDescriptionDialog newInstance(long cardId, long accountId) {
        final var dialog = new VisualDescriptionDialog();
        final var args = new Bundle();
        args.putLong(KEY_CARD, cardId);
        args.putLong(KEY_ACCOUNT, accountId);
        dialog.setArguments(args);
        return dialog;
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        cardModel = new ViewModelProvider(requireActivity()).get(EditCardViewModel.class);
        draft = new ViewModelProvider(this).get(VisualDescriptionDraft.class);
        final var dialog = new ComponentDialog(requireContext(), R.style.AppTheme);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        binding = DialogVisualDescriptionBinding.inflate(getLayoutInflater());
        dialog.setContentView(binding.getRoot());
        dialog.setCanceledOnTouchOutside(false);
        dialog.getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                requestClose();
            }
        });
        binding.cancel.setOnClickListener(v -> requestClose());
        binding.apply.setOnClickListener(v -> {
            binding.apply.setEnabled(false);
            main.postDelayed(loadTimeout, 5000);
            binding.webView.evaluateJavascript("window.DeckEditor.commit()", null);
        });

        if (draft.original == null) {
            draft.original = savedInstanceState == null ? currentDescription()
                    : savedInstanceState.getString(KEY_ORIGINAL, "");
            draft.markdown = savedInstanceState == null ? draft.original
                    : savedInstanceState.getString(KEY_DRAFT, draft.original);
            draft.sourceMode = savedInstanceState != null && savedInstanceState.getBoolean(KEY_SOURCE);
        }
        if (!matchesCard()) {
            showError(R.string.visual_editor_conflict);
            return dialog;
        }
        configureWebView();
        return dialog;
    }

    @Override
    public void onStart() {
        super.onStart();
        final var window = requireDialog().getWindow();
        if (window != null) {
            window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
            WindowCompat.setDecorFitsSystemWindows(window, false);
            window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            ViewCompat.setOnApplyWindowInsetsListener(binding.getRoot(), (view, insets) -> {
                final var bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
            ViewCompat.requestApplyInsets(binding.getRoot());
        }
    }

    @SuppressLint("SetJavaScriptEnabled") // Only bundled, isolated code can access the draft bridge.
    @SuppressWarnings("deprecation")
    private void configureWebView() {
        final var webView = binding.webView;
        final var settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setBlockNetworkLoads(true);
        settings.setBlockNetworkImage(true);
        settings.setDomStorageEnabled(false);
        settings.setDatabaseEnabled(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setTextZoom(Math.round(getResources().getConfiguration().fontScale * 100));
        webView.addJavascriptInterface(new DraftBridge(webView), "DeckBridge");
        final var assets = requireContext().getApplicationContext().getAssets();
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true; // Including links and target=_blank: never leave the local editor.
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                final var url = request.getUrl();
                final String file = url.getPath() == null ? "" : url.getPath();
                if ("GET".equals(request.getMethod()) && "https".equals(url.getScheme())
                        && "deck-editor.invalid".equals(url.getHost()) && url.getPort() == -1
                        && url.getQuery() == null
                        && ("/index.html".equals(file) || "/editor.js".equals(file) || "/editor.css".equals(file))) {
                    try {
                        final String mime = file.endsWith(".js") ? "application/javascript"
                                : file.endsWith(".css") ? "text/css" : "text/html";
                        return new WebResourceResponse(mime, "UTF-8", 200, "OK",
                                Map.of("Cache-Control", "no-store", "X-Content-Type-Options", "nosniff"),
                                assets.open("visual-editor" + file));
                    } catch (IOException ignored) {
                        main.post(() -> showError(R.string.visual_editor_error));
                    }
                }
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked",
                        Map.of(), new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) {
                if (request.isForMainFrame()) showError(R.string.visual_editor_error);
            }
        });
        main.postDelayed(loadTimeout, 15000);
        webView.loadUrl(EDITOR_URL);
    }

    private class DraftBridge {
        private final WebView owner;

        DraftBridge(WebView owner) {
            this.owner = owner;
        }

        private boolean isActive() {
            return binding != null && binding.webView == owner && !closing;
        }

        @JavascriptInterface
        public void onReady() {
            main.post(() -> {
                if (!isActive()) return;
                try {
                    final var options = new JSONObject();
                    options.put("markdown", draft.markdown);
                    options.put("sourceMode", draft.sourceMode);
                    options.put("language", getResources().getConfiguration().getLocales().get(0).getLanguage());
                    options.put("direction", getResources().getConfiguration().getLayoutDirection() == View.LAYOUT_DIRECTION_RTL ? "rtl" : "ltr");
                    options.put("descriptionLabel", getString(R.string.label_description));
                    options.put("labels", labels());
                    // JSONObject escapes user content; it is never concatenated into HTML.
                    binding.webView.evaluateJavascript("window.DeckEditor.initialize(" + options + ")", null);
                } catch (JSONException e) {
                    showError(R.string.visual_editor_error);
                }
            });
        }

        @JavascriptInterface
        public void onInitialized() {
            main.post(() -> {
                if (!isActive()) return;
                initialized = true;
                main.removeCallbacks(loadTimeout);
                binding.status.setVisibility(View.GONE);
                binding.apply.setEnabled(true);
            });
        }

        @JavascriptInterface
        public void onDraft(String markdown, boolean sourceMode) {
            main.post(() -> {
                if (!isActive()) return;
                draft.markdown = markdown;
                draft.sourceMode = sourceMode;
            });
        }

        @JavascriptInterface
        public void onApply(String markdown) {
            main.post(() -> {
                if (!isActive() || !initialized || markdown == null) return;
                main.removeCallbacks(loadTimeout);
                if (!matchesCard() || !Objects.equals(draft.original, currentDescription())) {
                    showError(R.string.visual_editor_conflict);
                    return;
                }
                closing = true;
                cardModel.changeDescriptionFromExternal(markdown);
                dismiss();
            });
        }

        @JavascriptInterface
        public void onError() {
            main.post(() -> {
                if (isActive()) showError(R.string.visual_editor_error);
            });
        }

        @JavascriptInterface
        public void onClose(String markdown, boolean sourceMode) {
            main.post(() -> {
                if (!isActive() || markdown == null) return;
                draft.markdown = markdown;
                draft.sourceMode = sourceMode;
                confirmClose();
            });
        }
    }

    private boolean matchesCard() {
        return cardModel.getFullCard() != null && cardModel.getAccount() != null && cardModel.canEdit()
                && cardModel.getFullCard().getCard().getId() == requireArguments().getLong(KEY_CARD)
                && cardModel.getAccount().getId() == requireArguments().getLong(KEY_ACCOUNT);
    }

    @NonNull
    private String currentDescription() {
        if (cardModel.getFullCard() == null) return "";
        return Objects.toString(cardModel.getFullCard().getCard().getDescription(), "");
    }

    private void requestClose() {
        if (initialized) {
            // Read the current editor content before deciding whether to ask
            // about discarding. The asynchronous draft callback may lag a tap.
            binding.webView.evaluateJavascript("window.DeckEditor.close()", null);
        } else {
            confirmClose();
        }
    }

    private void confirmClose() {
        if (Objects.equals(draft.original, draft.markdown)) {
            closing = true;
            dismiss();
        } else {
            new MaterialAlertDialogBuilder(requireContext())
                    .setMessage(R.string.visual_editor_discard)
                    .setNegativeButton(R.string.visual_editor_keep_editing, null)
                    .setPositiveButton(R.string.simple_discard, (dialog, which) -> {
                        closing = true;
                        dismiss();
                    }).show();
        }
    }

    private void showError(int message) {
        if (binding == null || closing) return;
        initialized = false;
        main.removeCallbacks(loadTimeout);
        binding.apply.setEnabled(false);
        binding.status.setText(message);
        binding.status.setVisibility(View.VISIBLE);
    }

    private JSONObject labels() throws JSONException {
        final var labels = new JSONObject();
        labels.put("visual", getString(R.string.visual_editor_visual));
        labels.put("source", getString(R.string.visual_editor_source));
        labels.put("checklist", getString(R.string.visual_editor_checklist));
        labels.put("bullet", getString(R.string.visual_editor_bullet));
        labels.put("ordered", getString(R.string.visual_editor_ordered));
        labels.put("bold", getString(R.string.visual_editor_bold));
        labels.put("italic", getString(R.string.visual_editor_italic));
        labels.put("strike", getString(R.string.visual_editor_strike));
        labels.put("heading", getString(R.string.visual_editor_heading));
        labels.put("link", getString(R.string.visual_editor_link));
        labels.put("removeLink", getString(R.string.visual_editor_remove_link));
        labels.put("indent", getString(R.string.visual_editor_indent));
        labels.put("outdent", getString(R.string.visual_editor_outdent));
        labels.put("undo", getString(R.string.visual_editor_undo));
        labels.put("redo", getString(R.string.visual_editor_redo));
        labels.put("cancel", getString(R.string.visual_editor_cancel));
        labels.put("apply", getString(R.string.visual_editor_apply));
        labels.put("unsupported", getString(R.string.visual_editor_unsupported));
        labels.put("invalidLink", getString(R.string.visual_editor_invalid_link));
        return labels;
    }

    @Override
    public void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putString(KEY_ORIGINAL, draft.original);
        outState.putString(KEY_DRAFT, draft.markdown);
        outState.putBoolean(KEY_SOURCE, draft.sourceMode);
    }

    @Override
    public void onDestroyView() {
        main.removeCallbacks(loadTimeout);
        initialized = false;
        if (binding != null) {
            binding.webView.removeJavascriptInterface("DeckBridge");
            binding.webView.stopLoading();
            ((ViewGroup) binding.webView.getParent()).removeView(binding.webView);
            binding.webView.destroy();
            binding = null;
        }
        super.onDestroyView();
    }
}
