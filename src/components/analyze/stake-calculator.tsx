"use client"

import { useState } from 'react';
import { CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, CheckCircle, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { stakingCalculator, StakingCalculatorInput } from '@/ai/flows/staking-calculator';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Bet } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


// Placeholder user data. In a real app, this would be fetched for the logged-in user from firestore.
const userData = {
    currentBankroll: 5000,
    preferredStakingModel: 'Kelly Fraccionario', // 'Fijo', 'Porcentual'
    kellyFraction: 0.25, // 1/4 Kelly. Only if preferredStakingModel is 'Kelly Fraccionario'
    fixedStakeAmount: 50, // Only if preferredStakingModel is 'Fijo'
    percentageStakeAmount: 2 // Only if preferredStakingModel is 'Porcentual'
} as const;


// Saves the bet to the 'bets' collection in Firestore
const saveBetToHistory = async (bet: Omit<Bet, 'id' | 'createdAt'>): Promise<void> => {
    try {
        await addDoc(collection(db, 'bets'), {
            ...bet,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error writing bet to Firestore: ", error);
        throw new Error("Could not save bet.");
    }
};


export function StakeCalculator({ stakeData, onBack }: { stakeData: { probability: number; odds: number; match: string, market: string; selection: string, sport: 'Fútbol' | 'Tenis' }, onBack: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [stake, setStake] = useState<number | null>(null);
  const [isBetRegistered, setIsBetRegistered] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const handleCalculateStake = async () => {
    setIsLoading(true);
    try {
      const input: StakingCalculatorInput = {
        probability: stakeData.probability,
        odds: stakeData.odds,
        currentBankroll: userData.currentBankroll,
        preferredStakingModel: userData.preferredStakingModel,
        ...(userData.preferredStakingModel === 'Kelly Fraccionario' && { kellyFraction: userData.kellyFraction }),
        ...(userData.preferredStakingModel === 'Fijo' && { fixedStakeAmount: userData.fixedStakeAmount }),
        ...(userData.preferredStakingModel === 'Porcentual' && { percentageStakeAmount: userData.percentageStakeAmount }),
      };
      const result = await stakingCalculator(input);
      setStake(result.recommendedStake);
    } catch(error) {
        console.error("Error calculating stake:", error);
        toast({
            variant: "destructive",
            title: "Error al Calcular",
            description: "No se pudo calcular el stake recomendado."
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleRegisterBet = async () => {
      if (stake === null) return;
      if (!user) {
          toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para guardar una apuesta.' });
          return;
      }

      setIsLoading(true);
      try {
        // We omit 'id' because Firestore generates it automatically.
        // We omit 'createdAt' because we use serverTimestamp().
        const betToSave: Omit<Bet, 'id' | 'createdAt'> = {
            userId: user.uid,
            sport: stakeData.sport,
            match: stakeData.match,
            market: stakeData.market,
            selection: stakeData.selection,
            odds: stakeData.odds,
            stake: stake,
            status: 'Pendiente',
            valueCalculated: (stakeData.probability * stakeData.odds) - 1,
            estimatedProbability: stakeData.probability * 100,
            profitOrLoss: 0,
        };

        await saveBetToHistory(betToSave);
        
        setIsBetRegistered(true);
        toast({
            title: "Apuesta Guardada",
            description: `Tu apuesta de $${stake?.toFixed(2)} ha sido guardada en el historial.`,
            action: (
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/history')}>
                Ver Historial
              </Button>
            ),
        });
      } catch (error) {
        console.error("Error registering bet:", error);
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: "No se pudo guardar la apuesta en el historial."
        });
      } finally {
        setIsLoading(false);
      }
  }

  return (
    <div>
      <CardContent className="space-y-4 pt-6">
        {!stake && !isLoading && (
            <Alert>
                <AlertTitle>Datos para Cálculo de Stake</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Probabilidad Estimada:</strong> {(stakeData.probability * 100).toFixed(2)}%</li>
                      <li><strong>Cuota de Mercado:</strong> {stakeData.odds.toFixed(2)}</li>
                      <li><strong>Bankroll Actual:</strong> ${userData.currentBankroll.toFixed(2)}</li>
                      <li><strong>Modelo de Staking Activo:</strong> {userData.preferredStakingModel}</li>
                    </ul>
                </AlertDescription>
            </Alert>
        )}

        {isLoading && (
            <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}

        {stake !== null && !isBetRegistered &&(
            <Alert variant="default" className="border-accent">
                <CheckCircle className="h-4 w-4 text-accent" />
                <AlertTitle>Stake Recomendado</AlertTitle>
                <AlertDescription className="text-2xl font-bold">
                    ${stake.toFixed(2)}
                </AlertDescription>
            </Alert>
        )}
        
        {isBetRegistered && (
            <Alert variant="default" className="border-green-500 bg-green-950/30">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertTitle>¡Apuesta Guardada en el Historial!</AlertTitle>
                <AlertDescription>
                    La operación con un stake de <strong>${stake?.toFixed(2)}</strong> ha sido registrada.
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading || isBetRegistered}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Análisis
        </Button>
        {stake === null && (
            <Button onClick={handleCalculateStake} disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Calcular Stake
            </Button>
        )}
        {stake !== null && !isBetRegistered &&(
            <Button onClick={handleRegisterBet} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Guardando...' : 'Guardar en Historial'}
            </Button>
        )}
        {isBetRegistered && (
             <Button onClick={() => router.push('/dashboard/analyze')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Analizar Otra
             </Button>
        )}
      </CardFooter>
    </div>
  )
}
