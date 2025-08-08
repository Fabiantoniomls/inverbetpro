"use client";

import { useState } from 'react';
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

interface ExtractPicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  picks: Pick[];
}

export function ExtractPicksModal({ isOpen, onClose, picks }: ExtractPicksModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsLoading(true);
    // TODO: In the next step, we will implement the logic to save these picks
    // to the 'bets' collection in Firestore.
    console.log("Picks to be sent to the counter:", picks);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Picks Enviados al Contador',
      description: `${picks.length} apuestas han sido registradas en tu historial.`,
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Picks Extraídos del Análisis</DialogTitle>
          <DialogDescription>
            La IA ha identificado las siguientes oportunidades de apuesta. Revísalas y envíalas al contador de apuestas para un seguimiento.
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
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Confirmar y Enviar al Contador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
