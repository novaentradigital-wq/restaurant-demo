import { notFound } from "next/navigation";
import type { MenuPayload } from "@/lib/api";
import { MenuView } from "./menu-view";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function generateStaticParams(): Promise<Array<{ qrToken: string }>> {
  return [{ qrToken: "demo" }];
}
export const dynamicParams = false;

async function fetchMenu(qrToken: string): Promise<MenuPayload | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/menu/qr/${qrToken}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MenuPayload;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ qrToken: string }>;
}

export default async function QrMenuPage({ params }: PageProps): Promise<React.ReactElement> {
  const { qrToken } = await params;
  const data = await fetchMenu(qrToken);
  if (!data) notFound();

  return <MenuView qrToken={qrToken} initial={data} />;
}
