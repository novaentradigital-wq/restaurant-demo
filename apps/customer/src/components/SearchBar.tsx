"use client";

import { Search, Mic } from "lucide-react";
import type { LanguageCode } from "@qrmenu/types";

interface Props {
  value: string;
  onChange: (v: string) => void;
  lang: LanguageCode;
}

export function SearchBar({ value, onChange, lang }: Props): React.ReactElement {
  const placeholder = lang === "TR" ? "Bugün canınız ne çekiyor?" : "What are you craving today?";

  return (
    <div className="group relative">
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-fg-subtle group-focus-within:text-brand">
        <Search className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-bg-card py-3.5 pl-11 pr-12 text-sm shadow-soft outline-none transition-all placeholder:text-fg-subtle focus:border-brand focus:shadow-card"
      />
      <button
        type="button"
        aria-label="Sesli arama"
        className="absolute inset-y-0 right-2 my-auto grid h-9 w-9 place-items-center rounded-xl text-fg-subtle hover:bg-bg-soft hover:text-brand transition"
      >
        <Mic className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
