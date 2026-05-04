"use client";

import { useState } from "react";
import Image from "next/image";
import { Wifi, Star, MapPin } from "lucide-react";
import type { LanguageCode } from "@qrmenu/types";
import type { MenuRestaurant, MenuTable } from "@/lib/api";
import { t } from "@/lib/i18n";

interface Props {
  restaurant: MenuRestaurant;
  table: MenuTable;
  lang: LanguageCode;
  onToggleLang: () => void;
}

export function WelcomeHeader({ restaurant, table, lang, onToggleLang }: Props): React.ReactElement {
  const [coverFailed, setCoverFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const showCover = !!restaurant.coverUrl && !coverFailed;
  const showLogo = !!restaurant.logoUrl && !logoFailed;

  return (
    <header className="relative">
      {/* Cover with food photo + dark gradient overlay */}
      <div className="relative h-56 w-full overflow-hidden rounded-b-[2rem] bg-bg-soft">
        {showCover ? (
          <Image
            src={restaurant.coverUrl!}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            {/* Sıcak gradient katmanları */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-accent" />
            <div className="absolute inset-0 bg-[radial-gradient(at_20%_20%,rgb(255_255_255_/_0.18),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(at_85%_80%,rgb(0_0_0_/_0.4),transparent_55%)]" />
            {/* Hafif desen */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(45deg,transparent_0_24px,rgb(255_255_255_/_0.06)_24px_26px)]"
            />
            {/* Dekoratif yemek emojileri (çok hafif) */}
            <div aria-hidden className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-4 p-6 text-2xl opacity-15">
              <span>🍲</span><span>🍖</span><span>🥗</span><span>🍰</span><span>☕</span><span>🍷</span>
              <span>🥟</span><span>🍕</span><span>🍮</span><span>🥙</span><span>🌶️</span><span>🍓</span>
              <span>🥖</span><span>🍝</span><span>🍵</span><span>🍯</span><span>🧁</span><span>🥩</span>
            </div>
          </div>
        )}
        {/* Dark gradient overlay (yazı okunaklığı için) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Top-right controls */}
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/20 border border-white/20"
            aria-label="WiFi"
            title="WiFi"
          >
            <Wifi className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={onToggleLang}
            className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 border border-white/20"
            aria-label={t(lang, "language")}
          >
            {lang === "TR" ? "🇹🇷  TR" : "🇬🇧  EN"}
          </button>
        </div>

        {/* Bottom content overlaid on cover */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-white">
          <div className="flex items-end gap-3">
            {/* Logo circle */}
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/90 bg-white shadow-2xl">
              {showLogo ? (
                <Image
                  src={restaurant.logoUrl!}
                  alt={restaurant.name}
                  width={64}
                  height={64}
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-3xl">🍽️</span>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              {/* Rating */}
              <div className="mb-1 flex items-center gap-1 text-xs font-medium text-white/85">
                <Star className="h-3 w-3 fill-gold text-gold" strokeWidth={0} />
                <span>4.8</span>
                <span className="text-white/50">·</span>
                <span>1.2k {lang === "TR" ? "değerlendirme" : "reviews"}</span>
              </div>

              <h1 className="font-serif text-2xl font-bold leading-tight tracking-tight drop-shadow-md">
                {restaurant.name}
              </h1>

              {/* Table badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur border border-white/25">
                <MapPin className="h-3 w-3" strokeWidth={2.5} />
                {t(lang, "table")} {table.label}
                {table.section ? <span className="text-white/70">· {table.section}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
