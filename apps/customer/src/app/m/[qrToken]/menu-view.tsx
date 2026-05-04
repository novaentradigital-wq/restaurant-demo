"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WelcomeHeader } from "@/components/WelcomeHeader";
import { CategoryStrip } from "@/components/CategoryStrip";
import { ProductCard } from "@/components/ProductCard";
import { ProductDrawer } from "@/components/ProductDrawer";
import { CallButtons } from "@/components/CallButtons";
import { SearchBar } from "@/components/SearchBar";
import { pickLocale, t } from "@/lib/i18n";
import type { LanguageCode } from "@qrmenu/types";
import type { MenuPayload, MenuProduct } from "@/lib/api";

interface Props {
  qrToken: string;
  initial: MenuPayload;
}

function emojiFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("çorba") || n.includes("soup")) return "🍲";
  if (n.includes("ana") || n.includes("main") || n.includes("yemek")) return "🍖";
  if (n.includes("tatlı") || n.includes("dessert")) return "🍰";
  if (n.includes("içecek") || n.includes("beverage") || n.includes("drink")) return "🥤";
  return "🍽️";
}

export function MenuView({ qrToken, initial }: Props): React.ReactElement {
  const [lang, setLang] = useState<LanguageCode>(initial.restaurant.defaultLang);
  const [activeCat, setActiveCat] = useState<string>(initial.categories[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [openProduct, setOpenProduct] = useState<MenuProduct | null>(null);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveCat(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [initial.categories]);

  const onCategorySelect = (id: string): void => {
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return initial.categories;
    const term = search.toLowerCase();
    return initial.categories
      .map((c) => ({
        ...c,
        products: c.products.filter(
          (p) =>
            pickLocale(p.name, lang).toLowerCase().includes(term) ||
            pickLocale(p.description, lang).toLowerCase().includes(term)
        ),
      }))
      .filter((c) => c.products.length > 0);
  }, [search, lang, initial.categories]);

  return (
    <div className="bg-grain min-h-screen pb-32">
      <div className="mx-auto max-w-2xl">
        <WelcomeHeader
          restaurant={initial.restaurant}
          table={initial.table}
          lang={lang}
          onToggleLang={() => setLang((l) => (l === "TR" ? "EN" : "TR"))}
        />

        <div className="mt-5 px-5">
          <SearchBar value={search} onChange={setSearch} lang={lang} />
        </div>

        <div className="mt-3 px-5">
          <CategoryStrip
            categories={initial.categories}
            active={activeCat}
            onSelect={onCategorySelect}
            lang={lang}
          />
        </div>

        <div className="space-y-10 px-5 pt-2">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-fg-muted">{t(lang, "no_results")}</p>
          ) : (
            filtered.map((cat) => {
              const name = pickLocale(cat.name, lang);
              return (
                <section
                  key={cat.id}
                  id={cat.id}
                  ref={(el) => {
                    sectionRefs.current[cat.id] = el;
                  }}
                  className="scroll-mt-24"
                >
                  {/* Premium category divider */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                    <div className="flex items-center gap-2.5 rounded-full border border-border bg-bg-card px-4 py-1.5 shadow-soft">
                      <span className="text-lg leading-none">{emojiFor(name)}</span>
                      <h2 className="font-serif text-base font-bold tracking-wide">
                        {name}
                      </h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                  </div>

                  <div className="grid gap-5">
                    {cat.products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        currency={initial.restaurant.currency}
                        lang={lang}
                        onClick={() => setOpenProduct(p)}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <ProductDrawer
          product={openProduct}
          currency={initial.restaurant.currency}
          lang={lang}
          onClose={() => setOpenProduct(null)}
        />

        <CallButtons qrToken={qrToken} lang={lang} />
      </div>
    </div>
  );
}
