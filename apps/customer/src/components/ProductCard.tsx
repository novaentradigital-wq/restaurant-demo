"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Clock, Flame, Leaf, WheatOff } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { pickLocale, t } from "@/lib/i18n";
import type { LanguageCode } from "@qrmenu/types";
import type { MenuProduct } from "@/lib/api";

interface Props {
  product: MenuProduct;
  currency: string;
  lang: LanguageCode;
  onClick: () => void;
}

const TAG_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode; label: { TR: string; EN: string } }> = {
  VEGAN: {
    bg: "bg-success/12",
    text: "text-success",
    icon: <Leaf className="h-3 w-3" strokeWidth={2.5} />,
    label: { TR: "Vegan", EN: "Vegan" },
  },
  SPICY: {
    bg: "bg-danger/12",
    text: "text-danger",
    icon: <Flame className="h-3 w-3" strokeWidth={2.5} />,
    label: { TR: "Acılı", EN: "Spicy" },
  },
  GLUTEN_FREE: {
    bg: "bg-accent/12",
    text: "text-accent",
    icon: <WheatOff className="h-3 w-3" strokeWidth={2.5} />,
    label: { TR: "Glutensiz", EN: "Gluten-free" },
  },
};

const HIGHLIGHT_BADGE: Record<string, { label: { TR: string; EN: string }; tone: string }> = {
  CHEF_PICK: {
    label: { TR: "Şefin Önerisi", EN: "Chef's Pick" },
    tone: "bg-gradient-to-r from-gold to-accent text-white",
  },
  NEW: {
    label: { TR: "Yeni", EN: "New" },
    tone: "bg-brand text-brand-fg",
  },
};

export function ProductCard({ product, currency, lang, onClick }: Props): React.ReactElement {
  const [favorite, setFavorite] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const showImage = !!primary?.url && !imgFailed;
  const disabled = !product.isAvailable;

  const highlight = product.tags.find((t) => HIGHLIGHT_BADGE[t]);
  const dietTags = product.tags.filter((t) => TAG_STYLES[t]);
  const prep = product.prepTimeMin;
  const fallbackEmoji = product.emoji ?? "🍽️";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-bg-card text-left shadow-card transition-all",
        disabled ? "opacity-60" : "hover:-translate-y-1 hover:shadow-card-hover active:scale-[0.99]"
      )}
    >
      {/* 16:9 photo on top */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-soft">
        {showImage ? (
          <Image
            src={primary!.url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            {/* Brand-colored gradient base */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand/25 via-accent/15 to-gold/20" />
            {/* Soft radial highlight */}
            <div className="absolute -inset-12 bg-[radial-gradient(closest-side,rgb(var(--bg-card)/0.5),transparent_70%)]" />
            {/* Decorative repeating mini emojis (very faint) */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,transparent_0_20px,rgb(0_0_0_/_0.05)_20px_22px)]"
            />
            {/* Hero emoji */}
            <div className="absolute inset-0 grid place-items-center">
              <span
                className="text-7xl drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                style={{ filter: "drop-shadow(0 4px 12px rgb(0 0 0 / 0.18))" }}
              >
                {fallbackEmoji}
              </span>
            </div>
          </div>
        )}

        {/* Out of stock overlay */}
        {disabled ? (
          <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-[2px]">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-fg shadow-lg">
              {t(lang, "out_of_stock")}
            </span>
          </div>
        ) : null}

        {/* Top-left highlight badge */}
        {highlight && !disabled ? (
          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-md",
                HIGHLIGHT_BADGE[highlight]!.tone
              )}
            >
              {highlight === "CHEF_PICK" ? "👨‍🍳" : "✨"}{" "}
              {HIGHLIGHT_BADGE[highlight]!.label[lang]}
            </span>
          </div>
        ) : null}

        {/* Top-right favorite */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFavorite(!favorite);
          }}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-fg backdrop-blur transition hover:bg-white shadow-md"
          aria-label="Favori"
        >
          <Heart
            className={cn("h-4 w-4 transition", favorite && "fill-danger text-danger")}
            strokeWidth={2.25}
          />
        </button>

        {/* Bottom-right prep time */}
        {prep ? (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <Clock className="h-3 w-3" strokeWidth={2.5} />
            {prep} {lang === "TR" ? "dk" : "min"}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-bold leading-tight text-fg line-clamp-2">
            {pickLocale(product.name, lang)}
          </h3>
          <div className="shrink-0 text-right">
            <div className="font-serif text-xl font-bold text-brand">
              {formatPrice(product.basePrice, currency)}
            </div>
          </div>
        </div>

        {product.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm italic text-fg-muted">
            {pickLocale(product.description, lang)}
          </p>
        ) : null}

        {dietTags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {dietTags.map((tag) => {
              const s = TAG_STYLES[tag]!;
              return (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    s.bg,
                    s.text
                  )}
                >
                  {s.icon}
                  {s.label[lang]}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </button>
  );
}
