"use client";

import { useEffect } from "react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Columns2,
  Heading2,
  Heading3,
  ImageIcon,
  Images,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";

import { ImageGallery } from "@/components/editor/extensions/image-gallery";
import { ResizableImage } from "@/components/editor/extensions/resizable-image";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onPickImage?: () => Promise<string | null>;
  onPickImages?: (max: number) => Promise<string[] | null>;
  error?: string;
}

const WIDTH_PRESETS = ["25%", "50%", "75%", "100%"] as const;

export function RichTextEditor({
  value,
  onChange,
  onPickImage,
  onPickImages,
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      ResizableImage.configure({ inline: false }),
      ImageGallery,
      Placeholder.configure({ placeholder: "Write your post content..." }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "tiptap px-3 py-2 text-sm text-foreground",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = async () => {
    if (!editor) return;

    if (onPickImage) {
      const path = await onPickImage();
      if (path) {
        editor
          .chain()
          .focus()
          .setImage({ src: path })
          .updateAttributes("image", { width: "100%" })
          .run();
      }
      return;
    }

    const url = window.prompt("Enter image URL");
    if (url) {
      editor
        .chain()
        .focus()
        .setImage({ src: url })
        .updateAttributes("image", { width: "100%" })
        .run();
    }
  };

  const insertGallery = async () => {
    if (!editor) return;

    if (onPickImages) {
      const paths = await onPickImages(3);
      if (paths?.length) editor.chain().focus().insertImageGallery(paths).run();
      return;
    }

    if (onPickImage) {
      const first = await onPickImage();
      if (!first) return;
      const second = await onPickImage();
      if (!second) return;
      editor.chain().focus().insertImageGallery([first, second]).run();
    }
  };

  const imageActive = Boolean(editor?.isActive("image"));
  const currentWidth = (editor?.getAttributes("image").width as string | undefined) ?? "100%";

  return (
    <div className="grid gap-1.5">
      <div
        className={cn(
          "overflow-hidden rounded-md border border-border bg-surface",
          error ? "border-destructive" : "",
        )}
      >
        <div className="flex flex-wrap gap-1 border-b border-border bg-background p-2">
          <ToolbarButton
            label="Bold"
            isActive={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            isActive={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            isActive={editor?.isActive("underline")}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 2"
            isActive={editor?.isActive("heading", { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            isActive={editor?.isActive("heading", { level: 3 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            isActive={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            isActive={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Link" isActive={editor?.isActive("link")} onClick={setLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Image" onClick={() => void insertImage()}>
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Gallery (2–3 images)" onClick={() => void insertGallery()}>
            <Images className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Wrap images as columns"
            onClick={() => editor?.chain().focus().wrapImagesInGallery().run()}
          >
            <Columns2 className="h-4 w-4" />
          </ToolbarButton>

          {imageActive && !editor?.isActive("imageGallery") ? (
            <div className="ml-1 flex items-center gap-0.5 border-l border-border pl-2">
              {WIDTH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  title={`Width ${preset}`}
                  onClick={() =>
                    editor?.chain().focus().updateAttributes("image", { width: preset }).run()
                  }
                  className={cn(
                    "rounded px-1.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-surface",
                    currentWidth === preset ? "bg-paseo-hover text-paseo-dark" : "",
                  )}
                >
                  {preset.replace("%", "")}
                </button>
              ))}
              <span className="px-1 text-[10px] text-muted">%</span>
            </div>
          ) : null}
        </div>
        <EditorContent editor={editor} />
      </div>
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}

function ToolbarButton({
  label,
  isActive,
  onClick,
  children,
}: {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-2 text-foreground transition-colors hover:bg-surface",
        isActive ? "bg-paseo-hover text-paseo-dark" : "",
      )}
    >
      {children}
    </button>
  );
}
