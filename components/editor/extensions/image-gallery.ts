import { Node, mergeAttributes, type CommandProps } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export type ImageGalleryOptions = {
  HTMLAttributes: Record<string, unknown>;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageGallery: {
      insertImageGallery: (srcs: string[]) => ReturnType;
      wrapImagesInGallery: () => ReturnType;
    };
  }
}

function columnsFromCount(count: number) {
  return Math.min(3, Math.max(2, count)) as 2 | 3;
}

function findConsecutiveImageRange(
  doc: ProseMirrorNode,
  anchorPos: number,
): { from: number; to: number; nodes: ProseMirrorNode[] } | null {
  let imagePos: number | null = null;
  let imageNode: ProseMirrorNode | null = null;

  const nodeAt = doc.nodeAt(anchorPos);
  if (nodeAt?.type.name === "image") {
    imagePos = anchorPos;
    imageNode = nodeAt;
  } else {
    const $pos = doc.resolve(anchorPos);
    const after = $pos.nodeAfter;
    const before = $pos.nodeBefore;
    if (after?.type.name === "image") {
      imagePos = anchorPos;
      imageNode = after;
    } else if (before?.type.name === "image") {
      imagePos = anchorPos - before.nodeSize;
      imageNode = before;
    }
  }

  if (imagePos == null || !imageNode) return null;

  const $img = doc.resolve(imagePos);
  if ($img.parent.type.name === "imageGallery") return null;

  const parent = $img.parent;
  const index = $img.index();
  const parentStart = $img.start();

  let fromIndex = index;
  let toIndex = index;

  while (fromIndex > 0 && parent.child(fromIndex - 1).type.name === "image") {
    fromIndex -= 1;
  }
  while (
    toIndex < parent.childCount - 1 &&
    parent.child(toIndex + 1).type.name === "image"
  ) {
    toIndex += 1;
  }

  const count = toIndex - fromIndex + 1;
  if (count < 2 || count > 3) return null;

  let from = parentStart;
  for (let i = 0; i < fromIndex; i += 1) {
    from += parent.child(i).nodeSize;
  }

  let to = from;
  const nodes = [];
  for (let i = fromIndex; i <= toIndex; i += 1) {
    const child = parent.child(i);
    to += child.nodeSize;
    nodes.push(child);
  }

  return { from, to, nodes };
}

export const ImageGallery = Node.create<ImageGalleryOptions>({
  name: "imageGallery",

  group: "block",

  content: "image+",

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          const value = Number(element.getAttribute("data-columns"));
          return value === 3 ? 3 : 2;
        },
        renderHTML: (attributes) => ({
          "data-columns": attributes.columns === 3 ? "3" : "2",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.image-gallery" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "image-gallery",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertImageGallery:
        (srcs: string[]) =>
        ({ commands }: CommandProps) => {
          const unique = srcs.filter(Boolean).slice(0, 3);
          if (unique.length < 2) return false;

          return commands.insertContent({
            type: this.name,
            attrs: { columns: columnsFromCount(unique.length) },
            content: unique.map((src) => ({
              type: "image",
              attrs: { src, width: "100%" },
            })),
          });
        },

      wrapImagesInGallery:
        () =>
        ({ state, dispatch, tr }: CommandProps) => {
          const { selection, doc, schema } = state;
          const anchorPos =
            selection instanceof NodeSelection ? selection.from : selection.$from.pos;

          const range = findConsecutiveImageRange(doc, anchorPos);
          if (!range) return false;

          const galleryType = schema.nodes.imageGallery;
          const imageType = schema.nodes.image;
          if (!galleryType || !imageType) return false;

          if (!dispatch) return true;

          const galleryNode = galleryType.create(
            { columns: columnsFromCount(range.nodes.length) },
            range.nodes.map((node) =>
              imageType.create({
                src: node.attrs.src,
                alt: node.attrs.alt ?? "",
                title: node.attrs.title ?? null,
                width: "100%",
              }),
            ),
          );

          tr.replaceWith(range.from, range.to, galleryNode);
          dispatch(tr.scrollIntoView());
          return true;
        },
    };
  },
});
