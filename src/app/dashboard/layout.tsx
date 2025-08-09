
"use client";

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
                 <div className="flex items-center gap-3">
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
