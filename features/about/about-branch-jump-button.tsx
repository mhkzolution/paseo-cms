"use client";

import { ChevronDown } from "lucide-react";

type AboutBranchJumpButtonProps = {
  targetId: string;
  label: string;
};

export function AboutBranchJumpButton({ targetId, label }: AboutBranchJumpButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paseo text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-paseo-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paseo"
    >
      <ChevronDown className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
