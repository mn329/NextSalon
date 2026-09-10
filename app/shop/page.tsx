import SectionHeading from "@/components/SectionHeading"
import { getShops } from "@/lib/services/shops";
import ShopCard from "@/components/ShopCard";

export default async function ShopPage() {
  const shops = await getShops();
  return (
    <section>
      <SectionHeading eyebrow="Shop" title="サロン一覧" description="サロンを探す" />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </section>
  )
}