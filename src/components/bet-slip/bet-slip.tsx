"use client"

import { useState } from 'react';
import { useBetSlip } from '@/hooks/use-bet-slip';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Bet } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';

export function BetSlip() {
  const { picks, removePick, clearSlip } = useBetSlip();
  const [stake, setStake] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const totalOdds = picks.reduce((acc, pick) => acc * pick.odds, 1);
  const potentialWinnings = stake * totalOdds;

  const handleRegisterBet = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Acción requerida",
            description: "Debes iniciar sesión para registrar apuestas.",
        });
        return;
    }
    if (picks.length === 0) return;
    
    setIsLoading(true);

    try {
        const batch = writeBatch(db);
        const betsCollectionRef = collection(db, 'bets');
        
        // Save as a combined bet
         const combinedBetDocRef = doc(betsCollectionRef);
         const combinedBet: Omit<Bet, 'id' | 'createdAt'> = {
             userId: user.uid,
             sport: 'Fútbol', // Or determine from picks
             match: picks.map(p => p.selection).join(' | '),
             market: 'Combinada',
             selection: `${picks.length} selecciones`,
             odds: totalOdds,
             stake: stake,
             status: 'Pendiente',
             valueCalculated: 0, // EV for parlays is more complex, omitting for now
             estimatedProbability: 0,
             profitOrLoss: 0,
         };
         batch.set(combinedBetDocRef, { ...combinedBet, createdAt: serverTimestamp() });

        await batch.commit();

        toast({
            title: 'Apuesta Combinada Registrada',
            description: `Tu apuesta de ${picks.length} selecciones ha sido guardada en tu historial.`,
             action: (
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/history')}>
                Ver Historial
              </Button>
            ),
        });
        clearSlip();

    } catch (error) {
        console.error("Error saving picks to history: ", error);
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: "No se pudieron guardar los picks. Inténtalo de nuevo.",
        });
    } finally {
        setIsLoading(false);
    }
  }


  if (picks.length === 0) {
    return null;
  }

  return (
    <Card className="hidden lg:flex flex-col w-80 h-fit max-h-[80vh] m-4 sticky top-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Cupón de Apuestas</CardTitle>
        <Badge variant="secondary">{picks.length}</Badge>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="space-y-3">
            {picks.map(pick => (
                <div key={pick.id} className="text-sm p-2 border rounded-md relative">
                    <p className="font-semibold text-primary">{pick.selection}</p>
                    <p className="text-muted-foreground">{pick.market}</p>
                    <p className="text-muted-foreground truncate">{pick.match}</p>
                    <div className="flex justify-between items-center mt-1">
                        <Badge variant="outline">Cuota: {pick.odds.toFixed(2)}</Badge>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePick(pick.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                         </Button>
                    </div>
                </div>
            ))}
        </CardContent>
      </ScrollArea>
      <CardFooter className="flex-col items-stretch space-y-4 border-t pt-4">
        <div className="flex justify-between font-bold">
            <span>Cuota Total:</span>
            <span>{totalOdds.toFixed(2)}</span>
        </div>
        <div className="space-y-2">
            <Label htmlFor="stake-combined">Importe Total:</Label>
            <Input 
                id="stake-combined"
                type="number"
                value={stake}
                onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                placeholder="10.00"
                className="text-right"
            />
        </div>
         <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ganancia Potencial:</span>
            <span className="font-semibold text-green-400">${potentialWinnings.toFixed(2)}</span>
        </div>
        <Button onClick={handleRegisterBet} disabled={isLoading || stake <= 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Apuesta
        </Button>
      </CardFooter>
    </Card>
  );
}
