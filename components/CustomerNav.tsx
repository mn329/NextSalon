import Link from "next/link"

export default function CustomerNav() {
  const linkClass = "block rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"

  return (
    <nav className="flex flex-col gap-1">
      <Link href="/mypage" className={linkClass}>ダッシュボード</Link>
      <Link href="/mypage/reservations" className={linkClass}>予約一覧</Link>
      <Link href="/mypage/favorites" className={linkClass}>お気に入り</Link>
      <Link href="/mypage/settings" className={linkClass}>設定</Link>
    </nav>
  )
}