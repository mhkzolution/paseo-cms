"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeleteResourceButtonProps {
  endpoint: string;
  label: string;
  redirectTo?: string;
}

export function DeleteResourceButton({ endpoint, label, redirectTo }: DeleteResourceButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Remove ${label}? This can be restored from the database.`);
    if (!confirmed) return;

    setIsDeleting(true);

    const response = await fetch(endpoint, { method: "DELETE" });

    if (!response.ok) {
      setIsDeleting(false);
      window.alert("Could not remove this item. Please try again.");
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Remove ${label}`}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {isDeleting ? "Removing..." : "Remove"}
    </button>
  );
}
