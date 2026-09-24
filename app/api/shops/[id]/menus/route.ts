import { NextResponse } from "next/server"
import { MOCK_SHOP_MENUS } from "@/data/MockData"

type Params = { params: Promise<{ id: string }> }
// http://localhost:3000/api/shops/[id]/menus
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  // DBからメニューデータを取得して、メニューを返す
  const menus = MOCK_SHOP_MENUS[id]
  
  if (!menus) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  // JSON形式でメニューデータを返す
  return NextResponse.json({ menus })
}
