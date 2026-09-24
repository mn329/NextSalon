import { NextResponse } from "next/server";
import { MOCK_SHOP_STAFF } from "@/data/MockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const staffs = MOCK_SHOP_STAFF[id];

  if (!staffs) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ staffs });
}