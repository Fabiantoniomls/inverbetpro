"use client"

import { useState } from 'react';
import { CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { stakingCalculator, StakingCalculatorInput } from '@/ai/flows/staking-calculator';
import { useToast } from '@/hooks/use-toast';

// Placeholder user data. In a real app, this would be fetched for the logged-in user.
const userData = {
    currentBankroll: 5000,
    preferredStakingModel: 'Kelly Fraccionario', // 'Fijo', 'Porcentual'
    kellyFraction: 0.25, // 1/4 Kelly. Only if preferredStakingModel is 'Kelly Fraccionario'
    fixedStakeAmount: 50, // Only if preferredStakingModel is 'Fijo'
    percentageStakeAmount: 2 // Only if preferredStakingModel is 'Porcentual'
} as const;

export function StakeCalculator({ stakeData, onBack }: { stakeData: { probability: number; odds: number; }, onBack: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [stake, setStake] = useState<number | null>(null);
  const [isBetRegistered, setIsBetRegistered] = useState(false);
  const { toast } = useToast();

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
      setIsLoading(true);
      try {
        // In a real app, this would be a server action to save the bet to Firestore.
        // The action would take details like match, market, odds, stake, etc.
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsBetRegistered(true);
        toast({
            title: "Apuesta Registrada",
            description: `Tu apuesta de $${stake?.toFixed(2)} ha sido guardada.`,
            variant: "default"
        });
      } catch (error) {
        console.error("Error registering bet:", error);
        toast({
            variant: "destructive",
            title: "Error al Registrar",
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
                <AlertTitle>Datos del Análisis</AlertTitle>
                <AlertDescription>
                    <p><strong>Probabilidad Estimada:</strong> {(stakeData.probability * 100).toFixed(2)}%</p>
                    <p><strong>Cuotas:</strong> {stakeData.odds.toFixed(2)}</p>
                    <p><strong>Bankroll Actual:</strong> ${userData.currentBankroll.toFixed(2)}</p>
                    <p><strong>Modelo de Staking:</strong> {userData.preferredStakingModel}</p>
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
            <Alert variant="default" className="border-green-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>¡Apuesta Registrada!</AlertTitle>
                <AlertDescription>
                    Tu apuesta de ${stake?.toFixed(2)} ha sido guardada en tu historial.
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading || isBetRegistered}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        {stake === null && (
            <Button onClick={handleCalculateStake} disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Calcular
            </Button>
        )}
        {stake !== null && !isBetRegistered &&(
            <Button onClick={handleRegisterBet} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Apuesta
            </Button>
        )}
        {isBetRegistered && (
             <Button onClick={onBack} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Finalizar
             </Button>
        )}
      </CardFooter>
    </div>
  )
}
