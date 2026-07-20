"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FolderOpen, ImageIcon, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadMediaFile } from "@/lib/media-upload";
import { MediaPickerDialog } from "@/features/media/media-picker-dialog";

interface CoverImageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function CoverImageField({ value, onChange }: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const media = await uploadMediaFile(file);
      onChange(media.path);
    } catch (uploadError) {
      setUploadError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-28 w-40 overflow-hidden rounded-md border border-border bg-background">
          {value ? (
            <Image src={value} alt="Cover preview" fill className="object-cover" sizes="160px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex min-w-[12rem] flex-1 flex-col gap-2">
          <input
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Image URL or choose from library"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload image
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Media library
            </Button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
        </div>
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => onChange(media.path)}
        accept={["IMAGE"]}
        title="Choose cover image"
      />
    </div>
  );
}
