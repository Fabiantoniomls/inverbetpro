"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useBetSlip } from '@/hooks/use-bet-slip';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, GripVertical, Trash, X } from 'lucide-react';
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

// Draggable state hook
const useDraggable = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const elementStartPos = useRef({ x: 0, y: 0 });

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        elementStartPos.current = position;
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        setPosition({
            x: elementStartPos.current.x + dx,
            y: elementStartPos.current.y + dy,
        });
    }, [isDragging]);

    const onMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);
    
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, onMouseMove, onMouseUp]);

    return { position, onMouseDown };
};


export function BetSlip() {
  const { picks, removePick, clearSlip } = useBetSlip();
  const [stakes, setStakes] = useState<{[key: string]: number}>({});
  const [combinedStake, setCombinedStake] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const { position, onMouseDown } = useDraggable();

  const totalOdds = useMemo(() => picks.reduce((acc, pick) => acc * pick.odds, 1), [picks]);
  const potentialWinnings = useMemo(() => combinedStake * totalOdds, [combinedStake, totalOdds]);
  
  const totalSimpleStake = useMemo(() => Object.values(stakes).reduce((acc, s) => acc + s, 0), [stakes]);
  const totalSimpleWinnings = useMemo(() => {
    return picks.reduce((acc, pick) => {
        const stake = stakes[pick.id] || 0;
        return acc + (stake * pick.odds);
    }, 0);
  }, [picks, stakes]);

  const handleStakeChange = (id: string, value: number) => {
    setStakes(prev => ({...prev, [id]: value}));
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

        if (type === 'simple') {
            picks.forEach(pick => {
                const stake = stakes[pick.id];
                if (stake && stake > 0) {
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
            className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl cursor-pointer"
            onClick={() => setIsMinimized(false)}
        >
             <CardHeader className="flex-row items-center justify-between p-3">
                <CardTitle className="text-base">Cupón de Apuestas</CardTitle>
                <Badge variant="secondary">{picks.length}</Badge>
            </CardHeader>
        </Card>
    )
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
        <Card className="flex flex-col w-96 max-h-[90vh] shadow-2xl">
            <CardHeader 
                className="flex-row items-center justify-between p-3 bg-muted/50 cursor-move"
                onMouseDown={onMouseDown}
            >
                <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">Cupón de Apuestas</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearSlip}>
                        <Trash className="h-4 w-4 text-muted-foreground" />
                    </Button>
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(true)}>
                        <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </CardHeader>
            
            <Tabs defaultValue="combined" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="combined">Combinadas</TabsTrigger>
                <TabsTrigger value="simple">Simples</TabsTrigger>
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
              
              <TabsContent value="combined">
                  <CardFooter className="flex-col items-stretch space-y-3 border-t p-3">
                    <div className="flex justify-between font-bold text-sm">
                        <span>Cuota Total:</span>
                        <span>{totalOdds.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="stake-combined" className="text-sm">Importe:</Label>
                        <Input 
                            id="stake-combined" type="number" value={combinedStake}
                            onChange={(e) => setCombinedStake(parseFloat(e.target.value) || 0)}
                            placeholder="10.00" className="h-8 w-24 text-right"
                        />
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ganancia Potencial:</span>
                        <span className="font-semibold text-green-400">${potentialWinnings.toFixed(2)}</span>
                    </div>
                    <Button onClick={() => handleRegisterBets('combined')} disabled={isLoading || combinedStake <= 0}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Apostar ${combinedStake.toFixed(2)}
                    </Button>
                 </CardFooter>
              </TabsContent>

              <TabsContent value="simple">
                   <CardFooter className="flex-col items-stretch space-y-3 border-t p-3">
                       {picks.map(pick => (
                           <div key={`stake-${pick.id}`} className="flex items-center justify-between gap-2">
                               <Label htmlFor={`stake-${pick.id}`} className="text-xs truncate flex-1">{pick.selection}</Label>
                               <Input 
                                   id={`stake-${pick.id}`} type="number"
                                   value={stakes[pick.id] || ''}
                                   onChange={(e) => handleStakeChange(pick.id, parseFloat(e.target.value) || 0)}
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
                       <Button onClick={() => handleRegisterBets('simple')} disabled={isLoading || totalSimpleStake <= 0}>
                           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                           Apostar ${totalSimpleStake.toFixed(2)}
                       </Button>
                   </CardFooter>
              </TabsContent>
            </Tabs>
        </Card>
    </div>
  );
}
