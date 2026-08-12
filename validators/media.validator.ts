import { z } from "zod";

const MEDIA_TYPE_VALUES = ["IMAGE", "PDF", "VIDEO"] as const;

export const mediaFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(80, "Folder name is too long"),
});

export const mediaListSchema = z.object({
  folderId: z.string().trim().optional(),
  type: z.enum(MEDIA_TYPE_VALUES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "oldest", "name-asc", "name-desc"]).optional(),
  page: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export const mediaPatchSchema = z.object({
  altText: z.string().max(500).nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  caption: z.string().max(2000).nullable().optional(),
  filename: z.string().trim().min(1).max(255).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export type MediaFolderInput = z.infer<typeof mediaFolderSchema>;
export type MediaListInput = z.infer<typeof mediaListSchema>;
