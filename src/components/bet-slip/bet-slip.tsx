"use client"

import { useState, useMemo } from 'react';
import { useBetSlip } from '@/hooks/use-bet-slip';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, Trash, X, Minimize2, Maximize2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Bet } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export function BetSlip() {
  const { picks, removePick, clearSlip } = useBetSlip();
  const [stakes, setStakes] = useState<{[key: string]: number}>({});
  const [combinedStake, setCombinedStake] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const totalOdds = useMemo(() => picks.reduce((acc, pick) => acc * pick.odds, 1), [picks]);
  const potentialWinnings = useMemo(() => (combinedStake || 0) * totalOdds, [combinedStake, totalOdds]);
  
  const totalSimpleStake = useMemo(() => Object.values(stakes).reduce((acc, s) => acc + (s || 0), 0), [stakes]);
  const totalSimpleWinnings = useMemo(() => {
    return picks.reduce((acc, pick) => {
        const stake = stakes[pick.id] || 0;
        return acc + (stake * pick.odds);
    }, 0);
  }, [picks, stakes]);

  const handleStakeChange = (id: string, value: string) => {
    const numericValue = parseFloat(value);
    setStakes(prev => ({...prev, [id]: isNaN(numericValue) ? 0 : numericValue }));
  }

  const handleCombinedStakeChange = (value: string) => {
    const numericValue = parseFloat(value);
    setCombinedStake(isNaN(numericValue) ? 0 : numericValue);
  }


  const handleRegisterBets = async (type: 'simple' | 'combined') => {
    if (!user) {
        toast({ variant: "destructive", title: "Acción requerida", description: "Debes iniciar sesión." });
        return;
    }
    if (picks.length === 0) return;

    setIsLoading(true);
    
    try {
        const batch = writeBatch(db);
        const betsCollectionRef = collection(db, 'bets');
        let betsCount = 0;

        if (type === 'simple') {
            picks.forEach(pick => {
                const stake = stakes[pick.id];
                if (stake && stake > 0) {
                    betsCount++;
                    const betDocRef = doc(betsCollectionRef);
                    const newBet: Omit<Bet, 'id' | 'createdAt'> = {
                        userId: user.uid,
                        sport: pick.sport, match: pick.match, market: pick.market, selection: pick.selection,
                        odds: pick.odds, stake: stake, status: 'Pendiente',
                        valueCalculated: pick.valueCalculated ?? 0, estimatedProbability: pick.estimatedProbability ?? 0,
                        profitOrLoss: 0,
                        source: { analysisId: pick.id, versionId: 'bet-slip' } // Simplified source
                    };
                    batch.set(betDocRef, { ...newBet, createdAt: serverTimestamp() });
                }
            });
        } else if (type === 'combined' && combinedStake > 0) {
            betsCount++;
            const combinedBetDocRef = doc(betsCollectionRef);
            const combinedBet: Omit<Bet, 'id' | 'createdAt'> = {
                userId: user.uid, sport: 'Combinada',
                match: picks.map(p => p.selection).join(' | '), market: `Combinada (${picks.length})`,
                selection: picks.map(p => p.selection).join(', '), odds: totalOdds,
                stake: combinedStake, status: 'Pendiente',
                valueCalculated: 0, estimatedProbability: 0, profitOrLoss: 0
            };
            batch.set(combinedBetDocRef, { ...combinedBet, createdAt: serverTimestamp() });
        }

        if (betsCount === 0) {
             toast({ variant: "destructive", title: "Sin importe", description: "Por favor, introduce un importe para apostar." });
             setIsLoading(false);
             return;
        }

        await batch.commit();
        toast({
            title: 'Apuesta(s) Registrada(s)',
            description: 'Tus selecciones se han guardado en el historial.',
            action: <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/history')}>Ver Historial</Button>,
        });
        clearSlip();

    } catch (error) {
        console.error("Error saving picks to history: ", error);
        toast({ variant: "destructive", title: "Error al Guardar", description: "No se pudieron guardar las apuestas." });
    } finally {
        setIsLoading(false);
    }
  }

  if (picks.length === 0) {
    return null;
  }
  
  if (isMinimized) {
    return (
         <Card 
            className="fixed bottom-4 right-4 z-50 w-auto shadow-2xl cursor-pointer hover:shadow-primary/50 transition-shadow"
            onClick={() => setIsMinimized(false)}
        >
             <CardHeader className="flex-row items-center justify-between p-3">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Cupón de Apuestas</CardTitle>
                    <Badge>{picks.length}</Badge>
                </div>
                 <Button variant="ghost" size="icon" className="h-6 w-6" >
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                </Button>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 flex flex-col w-96 max-h-[90vh] shadow-2xl">
        <CardHeader 
            className="flex-row items-center justify-between p-3 bg-muted/50 cursor-pointer"
            onClick={() => setIsMinimized(true)}
        >
            <div className="flex items-center gap-2">
                 <CardTitle className="text-sm font-semibold">
                    {`Cupón (${picks.length})`}
                    {picks.length > 1 && (
                        <span className="text-muted-foreground font-medium"> | @ {totalOdds.toFixed(2)}</span>
                    )}
                 </CardTitle>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); clearSlip(); }}>
                    <Trash className="h-4 w-4 text-muted-foreground" title="Vaciar cupón" />
                </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}>
                    <Minimize2 className="h-4 w-4 text-muted-foreground" title="Minimizar" />
                </Button>
            </div>
        </CardHeader>
        
        <Tabs defaultValue="combined" className="w-full flex flex-col flex-1">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="combined" className="rounded-none">Combinada</TabsTrigger>
            <TabsTrigger value="simple" className="rounded-none">Simples</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-grow">
            <CardContent className="p-3 space-y-2">
                {picks.map(pick => (
                    <div key={pick.id} className="text-sm p-2 border rounded-md relative group">
                        <div className="flex justify-between items-start">
                            <div className="pr-8">
                                <p className="font-semibold text-primary">{pick.selection}</p>
                                <p className="text-xs text-muted-foreground">{pick.market} - {pick.match}</p>
                            </div>
                            <Badge variant="outline" className="text-sm font-bold">{pick.odds.toFixed(2)}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-1 right-1 opacity-50 group-hover:opacity-100" onClick={() => removePick(pick.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                    </div>
                ))}
            </CardContent>
          </ScrollArea>
          
          <TabsContent value="combined" className="mt-0">
              <CardFooter className="flex-col items-stretch space-y-3 border-t bg-background/95 p-3">
                <div className="flex justify-between font-bold text-sm">
                    <span>Cuota Total:</span>
                    <span>{totalOdds.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="stake-combined" className="text-sm">Importe:</Label>
                    <Input 
                        id="stake-combined" type="number" value={combinedStake || ''}
                        onChange={(e) => handleCombinedStakeChange(e.target.value)}
                        placeholder="0.00" className="h-8 w-24 text-right"
                    />
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia Potencial:</span>
                    <span className="font-semibold text-green-400">${potentialWinnings.toFixed(2)}</span>
                </div>
                <Button onClick={() => handleRegisterBets('combined')} disabled={isLoading || !combinedStake || combinedStake <= 0} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Apostar ${combinedStake > 0 ? combinedStake.toFixed(2) : '0.00'}
                </Button>
             </CardFooter>
          </TabsContent>

          <TabsContent value="simple" className="mt-0">
               <CardFooter className="flex-col items-stretch space-y-3 border-t bg-background/95 p-3">
                   {picks.map(pick => (
                       <div key={`stake-${pick.id}`} className="flex items-center justify-between gap-2">
                           <Label htmlFor={`stake-${pick.id}`} className="text-xs truncate flex-1">{pick.selection}</Label>
                           <Input 
                               id={`stake-${pick.id}`} type="number"
                               value={stakes[pick.id] || ''}
                               onChange={(e) => handleStakeChange(pick.id, e.target.value)}
                               placeholder="0.00" className="h-8 w-24 text-right"
                            />
                       </div>
                   ))}
                   <Separator />
                   <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Importe Total:</span>
                       <span className="font-semibold">${totalSimpleStake.toFixed(2)}</span>
                   </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ganancia Potencial:</span>
                        <span className="font-semibold text-green-400">${totalSimpleWinnings.toFixed(2)}</span>
                    </div>
                   <Button onClick={() => handleRegisterBets('simple')} disabled={isLoading || totalSimpleStake <= 0} className="bg-accent text-accent-foreground hover:bg-accent/90">
                       {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                       Apostar ${totalSimpleStake > 0 ? totalSimpleStake.toFixed(2) : '0.00'}
                   </Button>
               </CardFooter>
          </TabsContent>
        </Tabs>
    </Card>
  );
}
