import Link from "next/link"

export default function AdminNav() {
  const linkClass = "block rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"

  return (
    <nav className="flex flex-col gap-1">
      <Link href="/admin" className={linkClass}>ダッシュボード</Link>
      <Link href="/admin/reservations" className={linkClass}>予約管理</Link>
      <Link href="/admin/menus" className={linkClass}>メニュー管理</Link>
      <Link href="/admin/settings" className={linkClass}>店舗情報</Link>
    </nav>
  )
}