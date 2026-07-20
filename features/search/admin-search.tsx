"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { AdminTableShell } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  href: string;
  type: string;
}

export function AdminSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSearching(true);

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const body = (await response.json().catch(() => null)) as
      | { results?: SearchResult[]; error?: string }
      | null;

    if (!response.ok) {
      setError(body?.error ?? "Unable to search.");
      setResults([]);
      setIsSearching(false);
      return;
    }

    setResults(body?.results ?? []);
    setIsSearching(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-2 sm:flex-row">
        <label htmlFor="admin-search" className="sr-only">
          Search content
        </label>
        <input
          id="admin-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages, news, events, promotions, branches, and stores"
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button type="submit" isLoading={isSearching} className="w-full sm:w-auto">
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <AdminTableShell>
        {results.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">No search results.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((result) => (
                <tr key={`${result.type}-${result.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{result.title}</p>
                    {result.description ? <p className="mt-1 line-clamp-2 text-muted">{result.description}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{result.type}</td>
                  <td className="px-4 py-3">
                    <Link href={result.href} className="text-foreground hover:text-accent">
                      {result.href}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTableShell>
    </div>
  );
}
