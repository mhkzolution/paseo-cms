export const ACCEPTED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
} as const;

export const MAX_FILE_SIZE_BYTES = {
  image: 5 * 1024 * 1024, // 5MB
  pdf: 20 * 1024 * 1024, // 20MB
  video: 200 * 1024 * 1024, // 200MB
} as const;

export type UploadKind = keyof typeof ACCEPTED_MIME_TYPES;

export function getUploadKind(mimeType: string): UploadKind | null {
  for (const kind of Object.keys(ACCEPTED_MIME_TYPES) as UploadKind[]) {
    if ((ACCEPTED_MIME_TYPES[kind] as readonly string[]).includes(mimeType)) {
      return kind;
    }
  }
  return null;
}

export function isFileSizeValid(kind: UploadKind, sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE_BYTES[kind];
}
