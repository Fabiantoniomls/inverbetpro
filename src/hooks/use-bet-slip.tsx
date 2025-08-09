"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
  const previousPicksRef = useRef<Pick[]>([]);

  useEffect(() => {
    // Check if a pick was added
    if (picks.length > previousPicksRef.current.length) {
      const newPick = picks[picks.length - 1];
      const isDuplicate = previousPicksRef.current.some(p => p.id === newPick.id);
      if (isDuplicate) {
         toast({
          variant: "default",
          title: "Selección ya en el cupón",
          description: "Ya has añadido esta apuesta al cupón.",
        });
        // Revert the state if a duplicate was added
        setPicks(previousPicksRef.current);
      } else {
        toast({
          title: "Selección Añadida",
          description: `${newPick.selection} @ ${newPick.odds.toFixed(2)}`,
        });
      }
    }

    // Update the ref to the current picks for the next render
    previousPicksRef.current = picks;

  }, [picks, toast]);

  const addPick = useCallback((pick: Pick) => {
    setPicks(prevPicks => {
      if (prevPicks.some(p => p.id === pick.id)) {
        // We still check here to prevent re-rendering if not necessary,
        // but the toast logic is now in useEffect.
        return prevPicks;
      }
      return [...prevPicks, pick];
    });
  }, []);

  const removePick = useCallback((pickId: string) => {
    setPicks(prevPicks => prevPicks.filter(p => p.id !== pickId));
    // The removal toast can be added here if needed, or also handled via useEffect
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
