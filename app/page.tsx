import SectionHeading from "@/components/SectionHeading";
import ShopCard from "@/components/ShopCard";
import { MOCK_SHOPS } from "@/data/MockData";



export default function Home() {
  const shops = MOCK_SHOPS;

  return (
    <section>
      <SectionHeading
          eyebrow="Featured Shops"
          title="今日の気分から選べるサロン"
          description="今の気分を、もっと自由に。あなたらしさを引き出すスタイルをご提案。"
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </section>
  )
}
