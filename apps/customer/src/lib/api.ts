import type { LocalizedText } from "@qrmenu/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface MenuTable {
  id: string;
  label: string;
  section?: string;
}

export interface MenuRestaurant {
  id: string;
  tenantId: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  currency: string;
  defaultLang: "TR" | "EN";
  socialLinks: Record<string, string>;
  openingHours: Record<string, Array<{ open: string; close: string }>>;
}

export interface MenuProductImage {
  url: string;
  isPrimary: boolean;
}

export interface MenuProductVariant {
  id: string;
  name: LocalizedText;
  priceDelta: string;
  isDefault: boolean;
}

export interface MenuProduct {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  ingredients: LocalizedText | null;
  basePrice: string;
  prepTimeMin?: number | null;
  emoji?: string;
  tags: string[];
  allergens: string[];
  isAvailable: boolean;
  images: MenuProductImage[];
  variants: MenuProductVariant[];
}

export interface MenuCategory {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  imageUrl: string | null;
  sortOrder: number;
  products: MenuProduct[];
}

export interface MenuPayload {
  table: MenuTable;
  restaurant: MenuRestaurant;
  categories: MenuCategory[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = (body as { message?: string }).message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  getMenuByQr: (qrToken: string): Promise<MenuPayload> => request(`/menu/qr/${qrToken}`),

  searchProducts: (restaurantId: string, q: string): Promise<MenuProduct[]> =>
    request(`/menu/restaurants/${restaurantId}/search?q=${encodeURIComponent(q)}`),

  createCall: (input: {
    qrToken: string;
    type: "WAITER" | "BILL" | "WATER" | "OTHER";
    paymentHint?: "CASH" | "CARD";
  }): Promise<{ id: string }> =>
    request(`/calls`, { method: "POST", body: JSON.stringify(input) }),
};
