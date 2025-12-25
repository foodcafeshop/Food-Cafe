
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
            <div className="hidden md:flex w-64 flex-col border-r bg-card sticky top-0 h-screen">
                <Sidebar className="h-full" />
            </div>

            <div className="md:hidden flex h-14 items-center border-b bg-card px-4 lg:px-6 sticky top-0 z-50 w-full">
                <MobileSidebar />
                <span className="font-bold text-lg ml-4">FoodCafe Admin</span>
            </div>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 text-foreground">
                {children}
            </main>
        </div>
    );
}
