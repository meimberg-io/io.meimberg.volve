"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MarkdownEditor({
  content,
  onChange,
  placeholder = "Schreibe hier...",
  disabled = false,
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: content || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Get markdown output via the tiptap-markdown extension
      const md = editor.storage.markdown.getMarkdown();
      onChange(md);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-invert max-w-none min-h-[80px] focus:outline-none text-sm leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  // Sync content from outside (AI streaming, version restore, etc.)
  useEffect(() => {
    if (editor) {
      const currentMd = editor.storage.markdown.getMarkdown();
      if (content !== currentMd) {
        editor.commands.setContent(content || "");
      }
    }
  }, [content, editor]);

  // Sync editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--muted-foreground);
          pointer-events: none;
          height: 0;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
