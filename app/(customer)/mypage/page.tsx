import SectionHeading from "@/components/SectionHeading";

export default function Page() {
  return (
    <div>
      <SectionHeading
        eyebrow="My Page"
        title="マイページ"
        description="予約状況やお気に入りの店舗を確認できます。"
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-950">次回の予約</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            現在、表示できる予約はありません。
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-950">
            お気に入り店舗
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            気になる店舗を保存すると、ここに表示されます。
          </p>
        </section>
      </div>
    </div>
  );
}