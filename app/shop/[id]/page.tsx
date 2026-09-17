import { getShop } from "@/lib/services/shops";
import { notFound } from "next/navigation";
import ShopHero from "@/components/ShopHero"; 

type Props = {
  params: Promise<{ id: string }>;
};
// ショップページを表示
export default async function ShopPage({ params }: Props) {
  // ショップIDを取得
  const { id } = await params;
  // ショップデータを取得
  const shop = await getShop(id);

  if (!shop) {
    return notFound();
  }

  return (
    <div>
      <ShopHero shop={shop} />
    </div>
  );
}