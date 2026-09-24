// server-onlyを使用することで、クライアントサイドでは使用できないようになる
import "server-only"
import type { Shop } from "@/types/shops"
import type { Menu } from "@/types/menu";
import type { Staff } from "@/types/staff";

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

export async function getMenus(shopId: string): Promise<Menu[]> {
  const res = await fetch(`${BASE_URL}/api/shops/${shopId}/menus`, {
    cache: "no-store",
  });

  // API が 404 → 空配列（コンポーネント側で「準備中」）
  if (res.status === 404) return [];

  if (!res.ok) throw new Error("メニューの取得に失敗しました");

  const data: { menus: Menu[] } = await res.json();
  // メニューデータを返す
  return data.menus;
}

export async function getStaffs(shopId: string): Promise<Staff[]> {
  const res = await fetch(`${BASE_URL}/api/shops/${shopId}/staffs`, {
    cache: "no-store",
  });
  // API が 404 → 空配列（コンポーネント側で「準備中」）
  if (res.status === 404) return [];

  // API が 500 → エラー（コンポーネント側でエラー表示）
  if (!res.ok) throw new Error("スタッフの取得に失敗しました");

  const data: { staffs: Staff[] } = await res.json();
  // スタッフデータを返す
  return data.staffs;
}
