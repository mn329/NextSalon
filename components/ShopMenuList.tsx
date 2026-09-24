import SectionHeading from "@/components/SectionHeading";
import type { Menu } from "@/types/menu";

export default function ShopMenuList({ menus }: { menus: Menu[] }) {
    if (menus.length === 0) {
      return <p className="text-sm text-slate-500">メニューは準備中です。</p>;
    }
  
    return (
      <div>
        <SectionHeading
          eyebrow="Menus"
          title="メニュー"
          description="メニューの価格と所要時間を確認できます。"
        />
        <div className="flex flex-col gap-4">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="flex items-start justify-between gap-6 rounded-2xl border border-slate-200 p-5"
            >
              <div>
                <p className="font-medium text-slate-950">{menu.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {menu.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold text-slate-950">
                  ¥{menu.price.toLocaleString("ja-JP")}
                </p>
                <p className="text-xs text-slate-500">
                  {menu.durationMinutes} min
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }