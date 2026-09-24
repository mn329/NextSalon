import { notFound } from "next/navigation";
import { getShop, getMenus, getStaffs } from "@/lib/services/shops";
import ShopHero from "@/components/ShopHero";
import ShopMenuList from "@/components/ShopMenuList";
import ShopStaffList from "@/components/ShopStaffList";

type Props = { params: Promise<{ id: string }> };

export default async function ShopDetailPage({ params }: Props) {
  const { id } = await params;
  const shop = await getShop(id);
  if (!shop) notFound();

  // 互いに依存しないデータを並列取得
  const [menus, staffs] = await Promise.all([getMenus(id), getStaffs(id)]);

  return (
    <div>
      <ShopHero shop={shop} />
      <section className="mt-12 grid gap-12 lg:grid-cols-2">
        <ShopMenuList menus={menus} />
        <ShopStaffList staffs={staffs} />
      </section>
    </div>
  );
}