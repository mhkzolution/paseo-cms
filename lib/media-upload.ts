export type UploadMediaResult = {
  id: string;
  folderId: string | null;
  filename: string;
  path: string;
  type: "IMAGE" | "PDF" | "VIDEO";
  size: number;
};

export async function uploadMediaFile(file: File, folderId?: string | null) {
  const formData = new FormData();
  formData.append("file", file);
  if (folderId) formData.append("folderId", folderId);

  const response = await fetch("/api/upload", { method: "POST", body: formData });
  const body = (await response.json().catch(() => null)) as { media?: UploadMediaResult; error?: string } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Upload failed. Please try again.");
  }

  if (!body?.media) {
    throw new Error("Upload failed. Please try again.");
  }

  return body.media;
}

export async function uploadMediaFiles(files: File[], folderId?: string | null) {
  const uploaded: UploadMediaResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      uploaded.push(await uploadMediaFile(file, folderId));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Could not upload ${file.name}`);
    }
  }

  if (!uploaded.length && errors.length) {
    throw new Error(errors[0] ?? "Upload failed. Please try again.");
  }

  return { uploaded, errors };
}
