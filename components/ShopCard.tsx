import type { Shop } from "@/types/shops"
import Image from "next/image"
import Link from "next/link"

type ShopCardProps = {
  shop: Shop
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="relative h-72 overflow-hidden">
        <Image
          src={shop.coverImage}
          alt={shop.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/65 via-slate-950/15 to-transparent" />
        <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700">
          {shop.area}
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-3xl font-semibold text-white">{shop.name}</p>
          <p className="mt-2 text-sm text-white/85">{shop.leadMessage}</p>
        </div>
      </div>

      <div className="space-y-5 px-5 py-6">
        <div className="flex flex-wrap gap-2">
          {shop.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-sm leading-6 text-slate-600">{shop.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">評価</p>
            <p className="text-lg font-semibold text-slate-900">
              {shop.rating}{" "}
              <span className="text-sm font-normal text-slate-500">
                ({shop.reviewCount}件)
              </span>
            </p>
          </div>
          <Link
            href={`/shop/${shop.id}`}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-600"
          >
            詳細を見る
          </Link>
        </div>
      </div>
    </article>
  )
}
