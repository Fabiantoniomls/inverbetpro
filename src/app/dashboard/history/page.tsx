"use client"

import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/components/history/data-table'
import { columns } from '@/components/history/columns'
import type { Bet } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

export default function HistoryPage() {
  const [data, setData] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const updateBetStatus = useCallback(async (betId: string, newStatus: 'Ganada' | 'Perdida') => {
    try {
      const bet = data.find(b => b.id === betId);
      if (!bet) {
        throw new Error("Bet not found");
      }
      
      let profitOrLoss = 0;
      if (newStatus === 'Ganada') {
        profitOrLoss = bet.stake * (bet.odds - 1);
      } else { // Perdida
        profitOrLoss = -bet.stake;
      }
      
      const betRef = doc(db, 'bets', betId);
      await updateDoc(betRef, {
        status: newStatus,
        profitOrLoss: profitOrLoss
      });

      toast({
        title: "Apuesta Actualizada",
        description: `La apuesta ha sido marcada como ${newStatus}.`,
      });
      // The onSnapshot listener will automatically update the UI.

    } catch (error) {
      console.error("Error updating bet status:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la apuesta.'
      });
    }
  }, [data, toast]);


  useEffect(() => {
    if (!user) {
      // If no user, don't attempt to fetch, just clear data and loading state
      if (!loading) setLoading(true);
      return;
    }

    setLoading(true);
    const betsRef = collection(db, 'bets');
    const q = query(betsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const betsData = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          createdAt: (docData.createdAt as Timestamp)?.toDate() ?? new Date(), // Convert Firestore Timestamp to JS Date
        } as Bet;
      });
      setData(betsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bets from Firestore:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las apuestas.' });
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user, toast]);

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
      <DataTable columns={columns({ updateBetStatus })} data={data} />
    </div>
  )
}
