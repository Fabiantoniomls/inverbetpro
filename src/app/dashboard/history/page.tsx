"use client"

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/history/data-table'
import { columns } from '@/components/history/columns'
import type { Bet } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

// In a real app, this would be a Genkit flow that connects to Firestore
async function getBets(): Promise<Bet[]> {
  try {
    const storedBets = localStorage.getItem('betHistory');
    if (storedBets) {
      const parsedBets = JSON.parse(storedBets).map((bet: any) => ({
        ...bet,
        createdAt: new Date(bet.createdAt), // Re-hydrate date object
      }));
      // Sort by date descending
      return parsedBets.sort((a: Bet, b: Bet) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  } catch (error) {
    console.error("Error fetching bets from localStorage:", error);
  }
  return [];
}


export default function HistoryPage() {
  const [data, setData] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBets = async () => {
      setLoading(true);
      const bets = await getBets();
      setData(bets);
      setLoading(false);
    };
    loadBets();
  }, []);

  if (loading) {
     return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Historial de Apuestas</h1>
        <p className="text-muted-foreground">
          Aquí puedes ver, filtrar y gestionar todas tus apuestas guardadas.
        </p>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Historial de Apuestas</h1>
      <p className="text-muted-foreground">
        Aquí puedes ver, filtrar y gestionar todas tus apuestas guardadas.
      </p>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
