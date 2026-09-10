import { MOCK_SHOPS } from "@/data/MockData";
import { NextResponse } from "next/server";

// http://localhost:3000/api/shops
export async function GET() {
//   DBからショップデータを取得
    const shops = MOCK_SHOPS;
    return NextResponse.json({ shops });
}