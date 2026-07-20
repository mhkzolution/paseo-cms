"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { label: "New", value: "NEW" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Spam", value: "SPAM" },
] as const;

interface LeasingStatusSelectProps {
  id: string;
  status: string;
}

export function LeasingStatusSelect({ id, status }: LeasingStatusSelectProps) {
  const [value, setValue] = useState(status);
  const [isSaving, setIsSaving] = useState(false);

  const updateStatus = async (nextStatus: string) => {
    setValue(nextStatus);
    setIsSaving(true);

    const response = await fetch(`/api/leasing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      setValue(status);
    }

    setIsSaving(false);
  };

  return (
    <select
      aria-label="Leasing status"
      value={value}
      disabled={isSaving}
      onChange={(event) => void updateStatus(event.target.value)}
      className="rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
