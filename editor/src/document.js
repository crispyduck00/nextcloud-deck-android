// SPDX-License-Identifier: GPL-3.0-or-later
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { Markdown } from '@tiptap/markdown';
import { EditorState } from '@tiptap/pm/state';
import { Marked } from 'marked';

// A separate parser is essential: Tiptap adds task-list tokens to its own
// Marked instance which the stock HTML renderer cannot render.
const commonMark = new Marked({ gfm: true, breaks: false });

// Images (including authenticated Deck attachments) are preserved as Markdown,
// but are deliberately not fetched by this offline editor.
const OfflineImage = Image.extend({
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.className = 'image-placeholder';
      dom.textContent = `▧ ${node.attrs.alt || node.attrs.title || node.attrs.src}`;
      return { dom };
    };
  },
});

export function createEditor(element, onUpdate = () => {}) {
  return new Editor({
    element,
    extensions: [
      StarterKit.configure({
        underline: false, // Underline has no portable Markdown representation.
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: { openOnClick: false, autolink: false },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { 'data-type': 'taskItem' },
        a11y: { checkboxLabel: node => node.firstChild?.textContent || '☐' },
      }),
      TableKit.configure({ table: { resizable: false } }),
      OfflineImage,
      Markdown.configure({ markedOptions: { gfm: true, breaks: false } }),
    ],
    content: '',
    contentType: 'markdown',
    editorProps: {
      attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Description' },
      // Keep clipboard HTML, embedded scripts, and foreign editor markup out of
      // the conversion path. Text is inserted literally, never as raw HTML.
      handlePaste(view, event) {
        const text = event.clipboardData?.getData('text/plain');
        if (text === undefined) return false;
        event.preventDefault();
        view.dispatch(view.state.tr.insertText(text));
        return true;
      },
      handleDrop: () => true,
    },
    onUpdate,
  });
}

// Compare rendered semantics, not Markdown spelling (* vs -, ATX vs setext,
// reference vs inline links). Use an inert template: nothing is executed.
// Be conservative: unsupported or lossy conversions stay in source mode.
function semantics(markdown) {
  const template = document.createElement('template');
  template.innerHTML = commonMark.parse(markdown);

  // Tight and loose single-paragraph list items have the same useful content.
  for (const li of template.content.querySelectorAll('li')) {
    const paragraphs = [...li.children].filter(child => child.tagName === 'P');
    if (paragraphs.length === 1) paragraphs[0].replaceWith(...paragraphs[0].childNodes);
  }
  function visit(node, inCode = false) {
    if (node.nodeType === 3) {
      const text = inCode ? node.textContent : node.textContent.replace(/\s+/g, ' ');
      const inlineSpace = node.parentElement?.matches('p,h1,h2,h3,h4,h5,h6,td,th,a,strong,em,del,span');
      return text.trim() || inCode || inlineSpace ? text : null;
    }
    if (node.nodeType !== 1 && node.nodeType !== 11) return null;
    const tag = node.nodeType === 11 ? 'root' : node.tagName.toLowerCase();
    const attrs = node.attributes ? [...node.attributes]
      .filter(attr => attr.name !== 'disabled')
      .map(attr => [attr.name, attr.value]).sort() : [];
    return [tag, attrs, [...node.childNodes]
      .map(child => visit(child, inCode || tag === 'pre' || tag === 'code'))
      .filter(child => child !== null)];
  }
  return JSON.stringify(visit(template.content));
}

export function canEditVisually(markdown, editor) {
  try {
    // Never feed raw HTML to a visual editor that only understands a subset.
    // This also protects comments, custom elements and HTML attachment embeds.
    let hasHtml = false;
    const tokens = commonMark.lexer(markdown);
    // Definitions can be unused yet intentional; serializers often discard
    // them. Footnotes also vary between Markdown dialects.
    if (Object.keys(tokens.links || {}).length || /\[\^[^\]]+\]/.test(markdown)) return false;
    commonMark.walkTokens(tokens, token => {
      if (token.type === 'html') hasHtml = true;
    });
    if (hasHtml) return false;
    const json = editor.markdown.parse(markdown);
    const serialized = editor.markdown.serialize(json);
    if (semantics(markdown) !== semantics(serialized)) return false;
    // Detect unstable conversions, too (e.g. unsupported nested constructs).
    return JSON.stringify(json) === JSON.stringify(editor.markdown.parse(serialized));
  } catch {
    return false;
  }
}

export class DescriptionDocument {
  constructor(editor, markdown = '') {
    this.editor = editor;
    this.load(markdown);
  }

  load(markdown) {
    this.original = markdown;
    this.visual = canEditVisually(markdown, this.editor);
    if (this.visual) {
      this.editor.commands.setContent(markdown, { contentType: 'markdown', emitUpdate: false });
      // Source-mode imports start a new history. Undo must never bring back a
      // previous description or undo the initial load itself.
      this.editor.view.updateState(EditorState.create({
        schema: this.editor.schema,
        doc: this.editor.state.doc,
        plugins: this.editor.state.plugins,
      }));
      this.baseline = JSON.stringify(this.editor.getJSON());
    }
    return this.visual;
  }

  getMarkdown() {
    // Opening a card, switching modes, or undoing all edits must not rewrite it.
    if (!this.visual || JSON.stringify(this.editor.getJSON()) === this.baseline) {
      return this.original;
    }
    return this.editor.getMarkdown();
  }
}
