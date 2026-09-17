// server-onlyを使用することで、クライアントサイドでは使用できないようになる
import "server-only"
import type { Shop } from "@/types/shops"

// .env で NEXT_PUBLIC_APP_URL を設定していない場合は、localhost:3000 を使用
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function getShops(): Promise<Shop[]> {
  // キャッシュを無効にすることで、最新のデータを取得する
  const res = await fetch(`${BASE_URL}/api/shops`, { cache: "no-store" })
  const data: { shops: Shop[] } = await res.json()
  return data.shops
}

export async function getShop(id: string): Promise<Shop | null> {
  // キャッシュを無効にすることで、最新のデータを取得する
  const res = await fetch(`${BASE_URL}/api/shops/${id}`, { cache: "no-store" });
  // 404エラーが返された場合は、nullを返す
  if (res.status === 404) return null;

  // ショップデータをJSON形式で取得
  const data: { shop: Shop } = await res.json();
  // ショップデータを返す
  return data.shop;
}