"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, FolderOpen, ImageIcon, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaPickerDialog } from "@/features/media/media-picker-dialog";
import { uploadMediaFiles } from "@/lib/media-upload";
import { cn } from "@/lib/utils";

export type AlbumImageValue = {
  url: string;
  alt?: string | null;
  caption?: string | null;
};

interface AlbumImagesFieldProps {
  value: AlbumImageValue[];
  onChange: (value: AlbumImageValue[]) => void;
  className?: string;
}

export function AlbumImagesField({ value, onChange, className }: AlbumImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addImages = (urls: string[]) => {
    const existing = new Set(value.map((image) => image.url));
    const next = urls.filter((url) => !existing.has(url)).map((url) => ({ url, alt: "", caption: "" }));
    if (next.length) onChange([...value, ...next]);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const { uploaded, errors } = await uploadMediaFiles(files);
      addImages(uploaded.map((item) => item.path));
      if (errors.length) setUploadError(errors.join(" "));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    onChange(next);
  };

  const updateImage = (index: number, patch: Partial<AlbumImageValue>) => {
    onChange(value.map((image, itemIndex) => (itemIndex === index ? { ...image, ...patch } : image)));
  };

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          อัปโหลดรูป
        </Button>
        <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
          เลือกจากคลัง
        </Button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}

      {value.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {value.map((image, index) => (
            <div key={`${image.url}-${index}`} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex gap-3">
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                  {image.url ? (
                    <Image src={image.url} alt={image.alt || `Album image ${index + 1}`} fill className="object-cover" sizes="128px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <ImageIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <input
                    className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    placeholder="Alt text"
                    value={image.alt ?? ""}
                    onChange={(event) => updateImage(index, { alt: event.target.value })}
                  />
                  <input
                    className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    placeholder="Caption (optional)"
                    value={image.caption ?? ""}
                    onChange={(event) => updateImage(index, { caption: event.target.value })}
                  />
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" className="px-2 py-1" disabled={index === 0} onClick={() => moveImage(index, -1)}>
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1"
                      disabled={index === value.length - 1}
                      onClick={() => moveImage(index, 1)}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" className="px-2 py-1" onClick={() => removeImage(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-muted">
          ยังไม่มีรูปในอัลบั้ม — อัปโหลดหรือเลือกจากคลังสื่อ
        </div>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          addImages([media.path]);
          setPickerOpen(false);
        }}
        accept={["IMAGE"]}
        title="เลือกรูปสำหรับอัลบั้ม"
      />
    </div>
  );
}
