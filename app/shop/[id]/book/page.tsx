import { notFound } from "next/navigation";
import SectionHeading from "@/components/SectionHeading";
import { getMenus, getShop, getStaffs } from "@/lib/services/shops";
import BookingForm from "@/components/booking/BookingForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookingPage({ params }: Props) {
  const { id } = await params;

  const shop = await getShop(id);
  if (!shop) {
    notFound();
  }

  const [menus, staffs] = await Promise.all([getMenus(id), getStaffs(id)]);

  return (
    <div>
      <SectionHeading
        eyebrow="Booking"
        title={`${shop.name} の予約`}
        description="メニュー・スタッフ・日時を選んで予約します。"
      />
      <div className="mt-8">
        <BookingForm shop={shop} menus={menus} staffs={staffs} />
      </div>
    </div>
  );
}