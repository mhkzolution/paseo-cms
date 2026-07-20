"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Remove ${userName}? This can be undone by an admin.`);
    if (!confirmed) return;

    setIsDeleting(true);

    const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });

    if (!response.ok) {
      setIsDeleting(false);
      window.alert("Could not remove this user. Please try again.");
      return;
    }

    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Remove ${userName}`}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {isDeleting ? "Removing..." : "Remove"}
    </button>
  );
}
