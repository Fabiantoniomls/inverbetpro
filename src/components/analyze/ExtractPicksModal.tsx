"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Pick } from '@/lib/types/analysis';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import type { Bet } from '@/lib/types';

interface ExtractPicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  picks: Pick[];
  analysisId: string;
  versionId: string;
}

export function ExtractPicksModal({ isOpen, onClose, picks, analysisId, versionId }: ExtractPicksModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const handleConfirm = async () => {
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

        picks.forEach(pick => {
            const betDocRef = doc(betsCollectionRef); // Create a new document reference
            const newBet: Omit<Bet, 'id' | 'createdAt'> = {
                userId: user.uid,
                sport: pick.sport,
                match: pick.match,
                market: pick.market,
                selection: pick.selection,
                odds: pick.odds,
                stake: 0, // Placeholder, user should define this later
                status: 'Pendiente',
                valueCalculated: pick.valueCalculated ?? 0,
                estimatedProbability: pick.estimatedProbability ?? 0,
                profitOrLoss: 0,
                source: {
                    analysisId: analysisId,
                    versionId: versionId,
                }
            };
            batch.set(betDocRef, { ...newBet, createdAt: serverTimestamp() });
        });

        await batch.commit();

        toast({
            title: 'Picks Enviados al Historial',
            description: `${picks.length} apuesta(s) ha(n) sido registrada(s) en tu historial.`,
             action: (
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/history')}>
                Ver Historial
              </Button>
            ),
        });
        onClose();

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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Picks Extraídos del Análisis</DialogTitle>
          <DialogDescription>
            La IA ha identificado las siguientes oportunidades de apuesta. Revísalas y envíalas al historial de apuestas para un seguimiento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4 my-4">
          {picks.map((pick, index) => (
            <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-base">{pick.selection}</p>
                        <p className="text-sm text-muted-foreground">{pick.match}</p>
                        <p className="text-sm text-muted-foreground">{pick.market}</p>
                    </div>
                    <Badge variant="secondary" className="text-base">
                       {pick.odds.toFixed(2)}
                    </Badge>
                </div>
                 <div className="mt-2 flex gap-4 text-xs">
                    {pick.valueCalculated !== undefined && (
                         <div className="flex flex-col">
                            <span className="text-muted-foreground">Valor</span>
                            <span className={`font-bold ${pick.valueCalculated > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(pick.valueCalculated * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                     {pick.estimatedProbability !== undefined && (
                         <div className="flex flex-col">
                            <span className="text-muted-foreground">Prob.</span>
                            <span className="font-bold">
                                {pick.estimatedProbability.toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || picks.length === 0}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Confirmar y Enviar al Historial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
