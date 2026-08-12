"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteMediaButton({ mediaId, filename }: { mediaId: string; filename: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete Asset\n\nThis asset will be removed from the Media Library.\n\nYou can restore it later if recovery is supported by the system.",
    );
    if (!confirmed) return;

    setIsDeleting(true);

    const response = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });

    if (!response.ok) {
      setIsDeleting(false);
      window.alert("Could not remove this file. Please try again.");
      return;
    }

    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Remove ${filename}`}
      className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
