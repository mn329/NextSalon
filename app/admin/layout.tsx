import AdminNav from "@/components/AdminNav"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <aside className="w-48 shrink-0">
        <AdminNav />
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
}
