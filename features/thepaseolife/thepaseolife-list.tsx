"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, GripVertical, ImageIcon, Plus, Trash2 } from "lucide-react";
import type { ThePaseoLifePost } from "@prisma/client";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { LocalizationSettings } from "@/lib/localization-settings";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "active" | "inactive";

interface ThePaseoLifeListProps {
  items: ThePaseoLifePost[];
  localization: LocalizationSettings;
}

export function ThePaseoLifeList({ items, localization }: ThePaseoLifeListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [ordered, setOrdered] = useState(items);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOrdered(items);
  }, [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ordered.filter((item) => {
      if (status === "active" && !item.isActive) return false;
      if (status === "inactive" && item.isActive) return false;
      if (!needle) return true;
      return item.title.toLowerCase().includes(needle);
    });
  }, [ordered, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const runBulk = async (action: "delete" | "activate" | "deactivate" | "reorder", ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    const response = await fetch("/api/admin/thepaseolife/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids }),
    });
    setBusy(false);
    if (!response.ok) {
      window.alert("Could not update ThePaseoLife items. Please try again.");
      return;
    }
    setSelected([]);
    router.refresh();
  };

  const duplicateItem = async (item: ThePaseoLifePost) => {
    setBusy(true);
    const response = await fetch("/api/admin/thepaseolife", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: item.image,
        title: `${item.title} (copy)`.slice(0, 150),
        description: item.description,
        linkUrl: item.linkUrl,
        openInNewTab: item.openInNewTab,
        sortOrder: item.sortOrder + 1,
        isActive: false,
        publishedAt: item.publishedAt,
      }),
    });
    setBusy(false);
    if (!response.ok) {
      window.alert("Could not duplicate this item.");
      return;
    }
    router.refresh();
  };

  const deleteItem = async (item: ThePaseoLifePost) => {
    const confirmed = window.confirm(`Remove ${item.title}? This can be restored from the database.`);
    if (!confirmed) return;
    await runBulk("delete", [item.id]);
  };

  const onDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...ordered];
    const moved = next[dragIndex];
    if (!moved) {
      setDragIndex(null);
      return;
    }
    next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setOrdered(next);
    setDragIndex(null);
    await runBulk(
      "reorder",
      next.map((item) => item.id),
    );
  };

  const allVisibleSelected = paged.length > 0 && paged.every((item) => selected.includes(item.id));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="ThePaseoLife"
        description="Curated promotional cards for the Membership homepage section"
        action={
          <Link
            href="/admin/content/thepaseolife/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search by title"
          className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as StatusFilter);
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {selected.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <span className="text-muted">{selected.length} selected</span>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => runBulk("activate", selected)}>
            Activate
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => runBulk("deactivate", selected)}>
            Deactivate
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => runBulk("delete", selected)}>
            Delete
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No ThePaseoLife posts yet"
          description="Create the first promotional card."
        />
      ) : (
        <AdminTableShell minWidth="64rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelected((current) => [...new Set([...current, ...paged.map((item) => item.id)])]);
                      } else {
                        const visible = new Set(paged.map((item) => item.id));
                        setSelected((current) => current.filter((id) => !visible.has(id)));
                      }
                    }}
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="px-2 py-3 font-medium" aria-label="Reorder" />
                <th className="px-4 py-3 font-medium">Thumbnail</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Destination URL</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((item, index) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(ordered.findIndex((row) => row.id === item.id))}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => onDrop(ordered.findIndex((row) => row.id === item.id))}
                  className={dragIndex === index ? "bg-background" : undefined}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={(event) => {
                        setSelected((current) =>
                          event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                        );
                      }}
                      aria-label={`Select ${item.title}`}
                    />
                  </td>
                  <td className="px-2 py-3 text-muted">
                    <GripVertical className="h-4 w-4 cursor-grab" aria-hidden="true" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border bg-background">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <ImageIcon className="h-4 w-4" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                  <td className="max-w-56 truncate px-4 py-3 text-muted">{item.description ?? "—"}</td>
                  <td className="max-w-48 truncate px-4 py-3 text-muted">{item.linkUrl}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        item.isActive
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted"
                      }
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.sortOrder}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(item.updatedAt, localization)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
                      <Link
                        href={`/admin/content/thepaseolife/${item.id}/edit`}
                        className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => duplicateItem(item)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted hover:bg-background hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted hover:bg-accent/10 hover:text-accent"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button type="button" variant="secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            Previous
          </Button>
          <span className="text-muted">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
