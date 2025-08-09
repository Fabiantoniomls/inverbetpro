

"use client";

import Link from 'next/link';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { BetSlip } from '@/components/bet-slip/bet-slip';
import { RealTimeClock } from '@/components/dashboard/RealTimeClock';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (email: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
      <div className="min-h-screen w-full flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
            <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
                 <div className="flex items-center gap-4">
                    <Link
                      href="/dashboard"
                      className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-all group-hover:scale-110"><path d="M12 22V12"/><path d="M12 12V2L18 5l-6 3"/><path d="M12 12V2L6 5l6 3"/><path d="M1 12h10"/><path d="M23 12h-10"/></svg>
                      <span className="sr-only">Inverapuestas Pro</span>
                    </Link>
                     <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt="Avatar" />
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.email}</span>
                        <span className="text-xs text-muted-foreground">Inversor Pro</span>
                    </div>
                 </div>
                <RealTimeClock />
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
        </div>
        <BetSlip />
      </div>
  );
}
