"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MediaFilter, MediaSort } from "@/features/media/media-toolbar";
import type { MediaListItem } from "@/features/media/types";

const MEDIA_PAGE_SIZE = 40;

interface UseMediaListOptions {
  folderId?: string | null;
  query?: string;
  type?: MediaFilter;
  sort?: MediaSort;
  accept?: MediaListItem["type"][];
}

interface MediaListResponse {
  media: MediaListItem[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
  hasMore: boolean;
  error?: string;
}

interface MediaListState {
  key: string;
  media: MediaListItem[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

const EMPTY_STATE: MediaListState = {
  key: "",
  media: [],
  total: 0,
  page: 1,
  hasMore: false,
  isLoading: true,
  isLoadingMore: false,
  error: null,
};

function dedupeMedia(media: MediaListItem[]) {
  return Array.from(new Map(media.map((item) => [item.id, item])).values());
}

export function useMediaList({
  folderId = null,
  query = "",
  type = "all",
  sort = "newest",
  accept,
}: UseMediaListOptions) {
  const [state, setState] = useState<MediaListState>(EMPTY_STATE);
  const [reloadVersion, setReloadVersion] = useState(0);
  const activeController = useRef<AbortController | null>(null);
  const acceptKey = accept?.join(",") ?? "";
  const acceptedTypes = useMemo(
    () => (acceptKey ? new Set(acceptKey.split(",") as MediaListItem["type"][]) : null),
    [acceptKey],
  );
  const requestKey = `${folderId ?? ""}\u0000${query.trim()}\u0000${type}\u0000${sort}\u0000${acceptKey}\u0000${reloadVersion}`;

  const buildRequestUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams({
        page: String(page),
        take: String(MEDIA_PAGE_SIZE),
        sort,
      });

      if (folderId) params.set("folderId", folderId);
      if (query.trim()) params.set("q", query.trim());
      if (type !== "all") params.set("type", type);

      return `/api/media?${params.toString()}`;
    },
    [folderId, query, sort, type],
  );

  const fetchPage = useCallback(
    async (page: number, signal: AbortSignal) => {
      const response = await fetch(buildRequestUrl(page), { signal });
      const body = (await response.json().catch(() => null)) as MediaListResponse | null;

      if (!response.ok) throw new Error(body?.error ?? "Could not load media.");

      return {
        ...body,
        media: (body?.media ?? []).filter((item) => !acceptedTypes || acceptedTypes.has(item.type)),
        total: body?.total ?? 0,
        page: body?.page ?? page,
        hasMore: body?.hasMore ?? false,
      };
    },
    [acceptedTypes, buildRequestUrl],
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    activeController.current?.abort();
    activeController.current = controller;

    const timer = window.setTimeout(async () => {
      setState({ ...EMPTY_STATE, key: requestKey });

      try {
        const result = await fetchPage(1, controller.signal);
        if (!active) return;
        setState({
          key: requestKey,
          media: dedupeMedia(result.media),
          total: result.total,
          page: result.page,
          hasMore: result.hasMore,
          isLoading: false,
          isLoadingMore: false,
          error: null,
        });
      } catch (loadError) {
        if (!active || controller.signal.aborted) return;
        setState({
          ...EMPTY_STATE,
          key: requestKey,
          isLoading: false,
          error: loadError instanceof Error ? loadError.message : "Could not load media.",
        });
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchPage, requestKey]);

  const reload = useCallback(() => {
    setReloadVersion((current) => current + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (state.key !== requestKey || !state.hasMore || state.isLoading || state.isLoadingMore) return;

    const controller = new AbortController();
    activeController.current?.abort();
    activeController.current = controller;
    setState((current) => ({ ...current, isLoadingMore: true, error: null }));

    try {
      const result = await fetchPage(state.page + 1, controller.signal);
      setState((current) => {
        if (current.key !== requestKey) return current;
        return {
          ...current,
          media: dedupeMedia([...current.media, ...result.media]),
          total: result.total,
          page: result.page,
          hasMore: result.hasMore,
          isLoadingMore: false,
        };
      });
    } catch (loadError) {
      if (controller.signal.aborted) return;
      setState((current) =>
        current.key === requestKey
          ? {
              ...current,
              isLoadingMore: false,
              error: loadError instanceof Error ? loadError.message : "Could not load more media.",
            }
          : current,
      );
    }
  }, [fetchPage, requestKey, state]);

  const currentState = state.key === requestKey ? state : { ...EMPTY_STATE, key: requestKey };

  return {
    media: currentState.media,
    total: currentState.total,
    page: currentState.page,
    hasMore: currentState.hasMore,
    isLoading: currentState.isLoading,
    isLoadingMore: currentState.isLoadingMore,
    error: currentState.error,
    reload,
    loadMore,
  };
}
