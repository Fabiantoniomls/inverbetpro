"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Pick } from '@/lib/types/analysis';
import { useToast } from './use-toast';

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

  const addPick = useCallback((pick: Pick) => {
    setPicks(prevPicks => {
      // Prevent adding the same pick twice
      if (prevPicks.some(p => p.id === pick.id)) {
        toast({
          variant: "default",
          title: "Selección ya en el cupón",
          description: "Ya has añadido esta apuesta al cupón.",
        });
        return prevPicks;
      }
      toast({
        title: "Selección Añadida",
        description: `${pick.selection} @ ${pick.odds.toFixed(2)}`,
      });
      return [...prevPicks, pick];
    });
  }, [toast]);

  const removePick = useCallback((pickId: string) => {
    setPicks(prevPicks => prevPicks.filter(p => p.id !== pickId));
  }, []);

  const clearSlip = useCallback(() => {
    setPicks([]);
  }, []);
  
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
