"use client"

import { useState } from 'react';
import { CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Placeholder user data and mock server action. In production, this would use real user data and call the Genkit flow.
const userData = {
    currentBankroll: 5000,
    preferredStakingModel: 'Kelly Fraccionario',
    kellyFraction: 0.25, // 1/4 Kelly
    fixedStakeAmount: 50,
    percentageStakeAmount: 2
}

const runStakingCalculation = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let recommendedStake = 0;
    const { probability, odds, currentBankroll, preferredStakingModel, kellyFraction } = data;
    if(preferredStakingModel === 'Kelly Fraccionario') {
        const edge = (probability * odds) - 1; // Simplified from (p*o - (1-p)) for mock
        const kelly_f = edge / (odds - 1);
        recommendedStake = currentBankroll * kelly_f * (kellyFraction || 0.25);
    } else {
        recommendedStake = 50;
    }

    return { recommendedStake: Math.max(0, Math.min(recommendedStake, currentBankroll)) };
}

export function StakeCalculator({ stakeData, onBack }: { stakeData: { probability: number; odds: number; }, onBack: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [stake, setStake] = useState<number | null>(null);
  const [isBetRegistered, setIsBetRegistered] = useState(false);

  const handleCalculateStake = async () => {
    setIsLoading(true);
    const input = {
      probability: stakeData.probability,
      odds: stakeData.odds,
      ...userData
    };
    const result = await runStakingCalculation(input);
    setStake(result.recommendedStake);
    setIsLoading(false);
  }

  const handleRegisterBet = async () => {
      setIsLoading(true);
      // Here would be the server action to save the bet to Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsBetRegistered(true);
      setIsLoading(false);
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
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
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
      </CardFooter>
    </div>
  )
}
