import imageSize from "image-size";
import type { MediaType } from "@prisma/client";

export type ExtractedMediaMetadata = {
  originalName: string;
  mimeType: string | null;
  extension: string | null;
  width: number | null;
  height: number | null;
};

export function extensionFromName(name: string): string | null {
  const ext = name.includes(".") ? name.split(".").pop() : "";
  if (!ext) return null;
  return ext.toLowerCase().replace(/^\./, "") || null;
}

export function extractMediaMetadata(
  buffer: Buffer,
  input: { mimeType: string; originalName: string; mediaType: MediaType | "IMAGE" | "PDF" | "VIDEO" },
): ExtractedMediaMetadata {
  const extension = extensionFromName(input.originalName);
  let width: number | null = null;
  let height: number | null = null;

  if (input.mediaType === "IMAGE") {
    try {
      const size = imageSize(buffer);
      width = typeof size.width === "number" ? size.width : null;
      height = typeof size.height === "number" ? size.height : null;
    } catch {
      width = null;
      height = null;
    }
  }

  return {
    originalName: input.originalName,
    mimeType: input.mimeType || null,
    extension,
    width,
    height,
  };
}
