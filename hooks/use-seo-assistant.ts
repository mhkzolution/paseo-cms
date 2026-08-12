"use client";

import { useMemo } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import {
  buildAssistantState,
  type AssistantState,
  type InternalLinkSuggestion,
} from "@/lib/seo-assistant";
import { buildPreviewSeoPayload, type PreviewSeoFormInput } from "@/lib/seo-preview";
import { analyzeSeoScore } from "@/lib/seo-score";

export const SEO_ASSISTANT_DEBOUNCE_MS = 300;

/** Editor form slice consumed by the A4 assistant pipeline. */
export type SeoEditorFormState = PreviewSeoFormInput;

export type UseSeoAssistantInput = {
  formState: SeoEditorFormState;
  internalLinkSuggestions: InternalLinkSuggestion[];
  linkSuggestionsStale?: boolean;
};

export function computeSeoAssistantState(input: UseSeoAssistantInput): AssistantState {
  const previewPayload = buildPreviewSeoPayload(input.formState);
  const scoreResult = analyzeSeoScore(previewPayload.scoreInput);

  return buildAssistantState({
    formState: input.formState,
    previewPayload,
    scoreResult,
    internalLinkSuggestions: input.internalLinkSuggestions,
    linkSuggestionsStale: input.linkSuggestionsStale,
  });
}

export function useSeoAssistant(
  input: UseSeoAssistantInput,
  delayMs = SEO_ASSISTANT_DEBOUNCE_MS,
): AssistantState {
  const debouncedFormState = useDebounce(input.formState, delayMs);

  return useMemo(
    () =>
      computeSeoAssistantState({
        formState: debouncedFormState,
        internalLinkSuggestions: input.internalLinkSuggestions,
        linkSuggestionsStale: input.linkSuggestionsStale,
      }),
    [debouncedFormState, input.internalLinkSuggestions, input.linkSuggestionsStale],
  );
}
