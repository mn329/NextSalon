import CustomerNav from "@/components/CustomerNav";

export default function CustomerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex gap-8">
            <aside className="w-48 shrink-0">
                <CustomerNav />
            </aside>
            <div className="flex-1">{children}</div>
        </div>
    );
}