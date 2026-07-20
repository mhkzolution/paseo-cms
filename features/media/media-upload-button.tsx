"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadMediaFiles } from "@/lib/media-upload";

interface MediaUploadButtonProps {
  folderId?: string | null;
  accept?: string;
  label?: string;
  multiple?: boolean;
  onUploaded?: (media: { id: string; path: string; filename: string }) => void;
  onBatchUploaded?: (media: Array<{ id: string; path: string; filename: string }>) => void;
}

export function MediaUploadButton({
  folderId = null,
  accept = "image/*,application/pdf,video/*",
  label = "Upload files",
  multiple = true,
  onUploaded,
  onBatchUploaded,
}: MediaUploadButtonProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setIsUploading(true);
    setError(null);
    setProgress(files.length > 1 ? `Uploading 0/${files.length}...` : null);

    try {
      const { uploaded, errors } = await uploadMediaFiles(files, folderId);

      if (uploaded.length === 1) {
        onUploaded?.(uploaded[0]!);
      }

      if (uploaded.length > 0) {
        onBatchUploaded?.(uploaded);
      }

      if (errors.length) {
        setError(
          uploaded.length
            ? `Uploaded ${uploaded.length} file(s). ${errors.length} failed.`
            : errors[0] ?? "Upload failed. Please try again.",
        );
      }

      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setProgress(null);
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button type="button" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" aria-hidden="true" />
        {progress ?? label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
      {error ? <p className="max-w-xs text-right text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
