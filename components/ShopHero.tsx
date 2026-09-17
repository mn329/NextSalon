import type { Shop } from "@/types/shops";
import Image from "next/image";
import Link from "next/link";

export default function ShopHero({ shop }: { shop: Shop }) {
    return (
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm mb-6">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          {/* 左: 画像 + 店名オーバーレイ */}
          <div className="relative min-h-96">
            <Image
              src={shop.coverImage}
              alt={shop.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
              <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700">
                {shop.area}
              </div>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
                {shop.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
                {shop.description}
              </p>
            </div>
          </div>
  
          {/* 右: 店舗情報 + 予約リンク */}
          <div className="bg-slate-950 px-8 py-10 text-white">
            <h3 className="text-sm font-medium tracking-[0.3em] text-rose-200 uppercase">
              Visit
            </h3>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-xs text-white/55">Address</h3>
                <p className="my-2 text-sm text-white/80">{shop.address}</p>
              </div>
              <div>
                <h3 className="text-xs text-white/55">Phone</h3>
                <p className="my-2 text-sm text-white/80">{shop.phone}</p>
              </div>
              <div>
                <h3 className="text-xs text-white/55">Business Hours</h3>
                <div className="my-2 text-sm text-white/80">
                  {shop.businessHours.map((hours) => (
                    <p key={hours}>{hours}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white/8 p-5">
                <h3 className="text-sm text-white/70">Review score</h3>
                <p className="mt-2 text-4xl font-semibold">{shop.rating}</p>
                <p className="text-sm text-white/70">
                  {shop.reviewCount} reviews
                </p>
              </div>
              <Link
                href={`/shop/${shop.id}/book`}
                className="inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-5 py-4 text-sm font-medium text-white transition hover:bg-rose-500"
              >
                この店舗で予約する
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
}