"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { LanguageCode } from "@qrmenu/types";
import { api } from "@/lib/api";

interface Props {
  qrToken: string;
  lang: LanguageCode;
}

type Status = "idle" | "sending" | "sent" | "error";

export function CallButtons({ qrToken, lang }: Props): React.ReactElement {
  const [status, setStatus] = useState<Status>("idle");
  const [billOpen, setBillOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sendCall = (type: "WAITER" | "BILL" | "WATER", paymentHint?: "CASH" | "CARD"): void => {
    setStatus("sending");
    startTransition(async () => {
      try {
        await api.createCall({ qrToken, type, paymentHint });
        setStatus("sent");
        setTimeout(() => setStatus("idle"), 2200);
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2400);
      }
      setBillOpen(false);
    });
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3",
          "bg-gradient-to-t from-bg via-bg/95 to-transparent"
        )}
      >
        <div className="grid grid-cols-3 gap-2">
          <CallButton
            label={t(lang, "call_waiter")}
            emoji="🔔"
            tone="brand"
            disabled={status === "sending"}
            onClick={() => sendCall("WAITER")}
          />
          <CallButton
            label={t(lang, "request_bill")}
            emoji="💳"
            tone="accent"
            disabled={status === "sending"}
            onClick={() => setBillOpen(true)}
          />
          <CallButton
            label={t(lang, "request_water")}
            emoji="💧"
            tone="neutral"
            disabled={status === "sending"}
            onClick={() => sendCall("WATER")}
          />
        </div>

        <Toast status={status} lang={lang} />
      </div>

      {billOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-fg/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setBillOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-bg-card p-6 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold">{t(lang, "bill_method_question")}</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="btn-secondary text-base" onClick={() => sendCall("BILL", "CASH")}>
                💵 {t(lang, "cash")}
              </button>
              <button className="btn-primary text-base" onClick={() => sendCall("BILL", "CARD")}>
                💳 {t(lang, "card")}
              </button>
            </div>
            <button
              className="btn-ghost mt-3 w-full text-sm"
              onClick={() => setBillOpen(false)}
            >
              {t(lang, "close")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CallButton({
  label,
  emoji,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  emoji: string;
  tone: "brand" | "accent" | "neutral";
  onClick: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const toneClass =
    tone === "brand"
      ? "bg-brand text-brand-fg"
      : tone === "accent"
      ? "bg-accent text-bg"
      : "bg-bg-card text-fg border border-border";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-xs font-semibold shadow-md transition-all",
        toneClass,
        disabled ? "opacity-60" : "active:scale-[0.97]"
      )}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function Toast({ status, lang }: { status: Status; lang: LanguageCode }): React.ReactElement | null {
  if (status === "idle") return null;
  const text = status === "sending" ? t(lang, "sending") : status === "sent" ? `✓ ${t(lang, "sent")}` : `✕ ${t(lang, "error")}`;
  const tone =
    status === "sent"
      ? "bg-success text-bg"
      : status === "error"
      ? "bg-danger text-bg"
      : "bg-fg text-bg";
  return (
    <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2">
      <div className={cn("rounded-full px-4 py-2 text-sm font-semibold shadow-lg animate-slide-up", tone)}>
        {text}
      </div>
    </div>
  );
}
