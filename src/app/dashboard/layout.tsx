import { AppSidebar } from '@/components/dashboard/app-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex">
      <AppSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
