"use client";

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

import { cn } from "@/lib/utils";

function parseWidthPercent(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(15, value));
  }
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*%?$/);
    if (match) return Math.min(100, Math.max(15, Number(match[1])));
  }
  return 100;
}

function ResizableImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const widthPercent = parseWidthPercent(node.attrs.width);
  const inGallery = editor.isActive("imageGallery");

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (inGallery) return;
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth = widthPercent;
      const parentWidth =
        imgRef.current?.closest(".tiptap")?.clientWidth ||
        imgRef.current?.parentElement?.clientWidth ||
        1;

      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const onMove = (moveEvent: PointerEvent) => {
        const deltaPx = moveEvent.clientX - startX;
        const deltaPercent = (deltaPx / parentWidth) * 100;
        const next = Math.round(Math.min(100, Math.max(15, startWidth + deltaPercent)));
        updateAttributes({ width: `${next}%` });
      };

      const onUp = () => {
        target.releasePointerCapture(event.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [inGallery, updateAttributes, widthPercent],
  );

  return (
    <NodeViewWrapper
      as="div"
      className={cn(
        "resizable-image relative my-2 inline-block max-w-full",
        selected && "is-selected",
      )}
      style={{ width: inGallery ? "100%" : `${widthPercent}%` }}
      data-drag-handle
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) || ""}
        title={(node.attrs.title as string) || undefined}
        className="h-auto w-full rounded-md"
        draggable={false}
      />
      {selected && !inGallery ? (
        <span
          role="presentation"
          onPointerDown={onResizePointerDown}
          className="absolute bottom-1 right-1 z-10 h-3.5 w-3.5 cursor-se-resize rounded-sm border-2 border-white bg-paseo shadow"
          title="ลากเพื่อปรับขนาด"
        />
      ) : null}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => {
          const styleWidth = element.style.width;
          if (styleWidth) return styleWidth;
          const attr = element.getAttribute("width");
          if (!attr) return "100%";
          return attr.includes("%") ? attr : `${attr}%`;
        },
        renderHTML: (attributes) => {
          const width = (attributes.width as string) || "100%";
          return {
            width,
            style: `width: ${width}; height: auto;`,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
