import type { LanguageCode } from "@qrmenu/types";

type Dict = Record<string, string>;

const dictionaries: Record<LanguageCode, Dict> = {
  TR: {
    welcome: "Hoş geldiniz",
    menu: "Menü",
    search: "Ürün ara…",
    no_results: "Sonuç bulunamadı",
    out_of_stock: "Tükendi",
    call_waiter: "Garson Çağır",
    request_bill: "Hesap İste",
    request_water: "Su İste",
    cash: "Nakit",
    card: "Kart",
    close: "Kapat",
    language: "Dil",
    ingredients: "İçindekiler",
    allergens: "Alerjenler",
    tags_VEGAN: "Vegan",
    tags_SPICY: "Acılı",
    tags_NEW: "Yeni",
    tags_CHEF_PICK: "Şefin Önerisi",
    allergen_GLUTEN: "Gluten",
    allergen_LACTOSE: "Süt",
    allergen_NUT: "Kuruyemiş",
    bill_method_question: "Nasıl ödemek istersiniz?",
    sent: "Gönderildi",
    sending: "Gönderiliyor…",
    error: "Bir hata oluştu",
    table: "Masa",
  },
  EN: {
    welcome: "Welcome",
    menu: "Menu",
    search: "Search a dish…",
    no_results: "No results",
    out_of_stock: "Sold out",
    call_waiter: "Call Waiter",
    request_bill: "Request Bill",
    request_water: "Request Water",
    cash: "Cash",
    card: "Card",
    close: "Close",
    language: "Language",
    ingredients: "Ingredients",
    allergens: "Allergens",
    tags_VEGAN: "Vegan",
    tags_SPICY: "Spicy",
    tags_NEW: "New",
    tags_CHEF_PICK: "Chef's Pick",
    allergen_GLUTEN: "Gluten",
    allergen_LACTOSE: "Dairy",
    allergen_NUT: "Nuts",
    bill_method_question: "How would you like to pay?",
    sent: "Sent",
    sending: "Sending…",
    error: "Something went wrong",
    table: "Table",
  },
};

export function t(lang: LanguageCode, key: keyof typeof dictionaries.TR): string {
  return dictionaries[lang][key] ?? key;
}

export function pickLocale(
  text: { TR?: string; EN?: string } | null | undefined,
  lang: LanguageCode
): string {
  if (!text) return "";
  return text[lang] ?? text.TR ?? text.EN ?? "";
}
