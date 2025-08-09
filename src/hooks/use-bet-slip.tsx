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
  const prevPicksRef = useRef<Pick[]>([]);

  useEffect(() => {
    // This effect runs after the picks state has been updated.
    // We compare the new state with the previous state to determine if a pick was added.
    if (picks.length > prevPicksRef.current.length) {
      const addedPick = picks[picks.length - 1];
      toast({
        title: "Selección Añadida",
        description: `${addedPick.selection} @ ${addedPick.odds.toFixed(2)}`,
      });
    }
    // Update the ref to the current picks for the next render.
    prevPicksRef.current = picks;
  }, [picks, toast]);

  const addPick = useCallback((pick: Omit<Pick, 'id'>) => {
    setPicks(prevPicks => {
      if (prevPicks.length >= MAX_PICKS) {
        toast({
          variant: "destructive",
          title: "Límite de selecciones alcanzado",
          description: `No puedes añadir más de ${MAX_PICKS} selecciones al cupón.`,
        });
        return prevPicks;
      }
      
      const newPickId = generatePickId(pick);
      const isDuplicate = prevPicks.some(p => p.id === newPickId);
      
      if (isDuplicate) {
         toast({
          variant: "default",
          title: "Selección ya en el cupón",
          description: "Ya has añadido esta apuesta al cupón.",
        });
        return prevPicks;
      }
      
      return [...prevPicks, { ...pick, id: newPickId }];
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
