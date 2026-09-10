// server-onlyを使用することで、クライアントサイドでは使用できないようになる
import "server-only"
import type { Shop } from "@/types/shops"

// .env で NEXT_PUBLIC_APP_URL を設定していない場合は、localhost:3000 を使用
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function getShops(): Promise<Shop[]> {
  const res = await fetch(`${BASE_URL}/api/shops`, { cache: "no-store" })
  const data: { shops: Shop[] } = await res.json()
  return data.shops
}