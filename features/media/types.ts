export type MediaListItem = {
  id: string;
  folderId: string | null;
  filename: string;
  originalName: string | null;
  path: string;
  type: "IMAGE" | "PDF" | "VIDEO";
  size: number;
  mimeType: string | null;
  extension: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  caption: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type MediaFolderOption = {
  id: string;
  name: string;
};
