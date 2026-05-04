"use client";

import { useEffect } from "react";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import { pickLocale, t } from "@/lib/i18n";
import type { LanguageCode } from "@qrmenu/types";
import type { MenuProduct } from "@/lib/api";

interface Props {
  product: MenuProduct | null;
  currency: string;
  lang: LanguageCode;
  onClose: () => void;
}

export function ProductDrawer({ product, currency, lang, onClose }: Props): React.ReactElement | null {
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-fg/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-lg overflow-hidden bg-bg-card animate-slide-up",
          "rounded-t-3xl sm:rounded-3xl shadow-2xl",
          "max-h-[90vh] flex flex-col"
        )}
      >
        <div className="relative aspect-[16/10] w-full shrink-0 bg-bg-soft">
          {primary?.url ? (
            <Image src={primary.url} alt="" fill sizes="500px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">🍽️</div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-bg/90 text-fg backdrop-blur"
            aria-label={t(lang, "close")}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{pickLocale(product.name, lang)}</h2>
            <span className="text-lg font-bold text-brand">
              {formatPrice(product.basePrice, currency)}
            </span>
          </div>

          {product.description ? (
            <p className="mt-2 text-fg-muted">{pickLocale(product.description, lang)}</p>
          ) : null}

          {product.ingredients ? (
            <section className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                {t(lang, "ingredients")}
              </h3>
              <p className="mt-1 text-sm text-fg-muted">
                {pickLocale(product.ingredients, lang)}
              </p>
            </section>
          ) : null}

          {product.allergens.length > 0 ? (
            <section className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                {t(lang, "allergens")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.allergens.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning"
                  >
                    ⚠ {t(lang, `allergen_${a}` as never)}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {product.variants.length > 0 ? (
            <section className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                {lang === "TR" ? "Porsiyon" : "Portion"}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {product.variants.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded-xl bg-bg-soft px-3 py-2"
                  >
                    <span className="font-medium">{pickLocale(v.name, lang)}</span>
                    <span className="text-sm text-fg-muted">
                      {Number(v.priceDelta) > 0
                        ? `+${formatPrice(v.priceDelta, currency)}`
                        : pickLocale({ TR: "Standart", EN: "Standard" }, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="mt-6 rounded-2xl border border-dashed border-border p-3 text-center text-xs text-fg-subtle">
            {lang === "TR"
              ? "Sipariş için lütfen garsonu çağırın."
              : "Please call the waiter to place an order."}
          </p>
        </div>
      </div>
    </div>
  );
}
