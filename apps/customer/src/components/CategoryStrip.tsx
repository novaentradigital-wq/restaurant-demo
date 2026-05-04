"use client";

import { cn } from "@/lib/utils";
import { pickLocale } from "@/lib/i18n";
import type { LanguageCode } from "@qrmenu/types";
import type { MenuCategory } from "@/lib/api";

interface Props {
  categories: MenuCategory[];
  active: string;
  onSelect: (id: string) => void;
  lang: LanguageCode;
}

/** Kategori adına göre emoji eşleştir (TR/EN) */
function emojiFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("çorba") || n.includes("soup")) return "🍲";
  if (n.includes("ana") || n.includes("main") || n.includes("yemek")) return "🍖";
  if (n.includes("tatlı") || n.includes("dessert")) return "🍰";
  if (n.includes("içecek") || n.includes("beverage") || n.includes("drink")) return "🥤";
  if (n.includes("salata") || n.includes("salad")) return "🥗";
  if (n.includes("başlangıç") || n.includes("starter") || n.includes("appetizer")) return "🥟";
  if (n.includes("kahve") || n.includes("coffee")) return "☕";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger")) return "🍔";
  return "🍽️";
}

export function CategoryStrip({ categories, active, onSelect, lang }: Props): React.ReactElement {
  return (
    <nav
      className="sticky top-0 z-30 -mx-5 border-b border-border/60 bg-bg/80 px-5 py-3 backdrop-blur-xl"
      aria-label="Categories"
    >
      <ul className="no-scrollbar scroll-snap-x flex gap-2 overflow-x-auto">
        {categories.map((c) => {
          const isActive = c.id === active;
          const label = pickLocale(c.name, lang);
          return (
            <li key={c.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-brand text-brand-fg shadow-chip -translate-y-0.5"
                    : "border border-border bg-bg-card text-fg-muted hover:border-brand/40 hover:text-fg"
                )}
              >
                <span className="text-base leading-none">{emojiFor(label)}</span>
                <span>{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive
                      ? "bg-white/25 text-brand-fg"
                      : "bg-bg-soft text-fg-subtle"
                  )}
                >
                  {c.products.length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
