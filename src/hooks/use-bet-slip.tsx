"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Pick } from '@/lib/types/analysis';
import { useToast } from './use-toast';

const MAX_PICKS = 15;

// Function to generate a consistent, unique ID for a pick based on its content
const generatePickId = (pick: Omit<Pick, 'id'>) => {
  return `${pick.match}-${pick.market}-${pick.selection}`.replace(/\s+/g, '-').toLowerCase();
};


interface BetSlipContextType {
  picks: Pick[];
  addPick: (pick: Pick) => void;
  removePick: (pickId: string) => void;
  clearSlip: () => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export const BetSlipProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [picks, setPicks] = useState<Pick[]>([]);
  const { toast } = useToast();

  const addPick = useCallback((pick: Omit<Pick, 'id'>) => {
    const newPickId = generatePickId(pick);

    const isDuplicate = picks.some(p => p.id === newPickId);
    if (isDuplicate) {
      toast({
        variant: "default",
        title: "La selección ya está en el cupón",
      });
      return; 
    }

    if (picks.length >= MAX_PICKS) {
      toast({
        variant: "destructive",
        title: "Límite de selecciones alcanzado",
        description: `No puedes añadir más de ${MAX_PICKS} selecciones al cupón.`,
      });
      return;
    }
    
    setPicks(prevPicks => [...prevPicks, { ...pick, id: newPickId }]);
    
    toast({
      title: "Selección Añadida",
      description: `${pick.selection} @ ${pick.odds.toFixed(2)}`,
    });
    
  }, [picks, toast]);


  const removePick = useCallback((pickId: string) => {
    setPicks(prevPicks => prevPicks.filter(p => p.id !== pickId));
     toast({
        title: "Selección Eliminada",
        description: `La selección ha sido eliminada del cupón.`,
      });
  }, [toast]);

  const clearSlip = useCallback(() => {
    if (picks.length > 0) {
      setPicks([]);
      toast({
          title: "Cupón Vaciado",
          description: `Se han eliminado todas las selecciones.`,
        });
    }
  }, [picks.length, toast]);
  
  return (
    <BetSlipContext.Provider value={{ picks, addPick, removePick, clearSlip }}>
      {children}
    </BetSlipContext.Provider>
  );
};

export const useBetSlip = (): BetSlipContextType => {
  const context = useContext(BetSlipContext);
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
};
