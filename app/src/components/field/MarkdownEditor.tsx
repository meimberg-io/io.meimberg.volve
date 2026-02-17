"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
} from "lucide-react";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function BubbleButton({
  onClick,
  isActive,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        isActive
          ? "bg-foreground/15 text-foreground"
          : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (editor.storage as any).markdown.getMarkdown();
      onChange(md);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-invert max-w-none min-h-[80px] focus:outline-none text-xs leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  // Sync content from outside (AI streaming, version restore, etc.)
  useEffect(() => {
    if (editor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentMd = (editor.storage as any).markdown.getMarkdown();
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

  const iconSize = "h-3.5 w-3.5";

  return (
    <div className="relative">
      {editor && !disabled && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {/* Inline */}
          <BubbleButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Fett"
          >
            <Bold className={iconSize} />
          </BubbleButton>
          <BubbleButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Kursiv"
          >
            <Italic className={iconSize} />
          </BubbleButton>
          <BubbleButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Durchgestrichen"
          >
            <Strikethrough className={iconSize} />
          </BubbleButton>
          <BubbleButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Code"
          >
            <Code className={iconSize} />
          </BubbleButton>

          <div className="mx-0.5 h-4 w-px bg-border" />

          {/* Headings */}
          <BubbleButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Überschrift 1"
          >
            <Heading1 className={iconSize} />
          </BubbleButton>
          <BubbleButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Überschrift 2"
          >
            <Heading2 className={iconSize} />
          </BubbleButton>
          <BubbleButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Überschrift 3"
          >
            <Heading3 className={iconSize} />
          </BubbleButton>

          <div className="mx-0.5 h-4 w-px bg-border" />

          {/* Blocks */}
          <BubbleButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Aufzählung"
          >
            <List className={iconSize} />
          </BubbleButton>
          <BubbleButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Nummerierte Liste"
          >
            <ListOrdered className={iconSize} />
          </BubbleButton>
          <BubbleButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Zitat"
          >
            <Quote className={iconSize} />
          </BubbleButton>
          <BubbleButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Trennlinie"
          >
            <Minus className={iconSize} />
          </BubbleButton>
        </BubbleMenu>
      )}

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
        .tiptap h1 {
          font-size: 1.25rem;
        }
        .tiptap h2 {
          font-size: 1rem;
        }
        .tiptap h3 {
          font-size: 0.75rem;
        }
        .tiptap p,
        .tiptap li {
          color: #aaaaaa;
        }
        .tiptap ul,
        .tiptap ol {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
        .tiptap li {
          margin-top: 0;
          margin-bottom: 0;
        }
        .tiptap li p {
          margin-top: 0;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
