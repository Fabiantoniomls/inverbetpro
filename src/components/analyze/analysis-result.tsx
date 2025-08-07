"use client"

import { CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StakeCalculator } from "./stake-calculator"
import { useState } from "react"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

interface AnalysisResultProps {
  result: {
    analysis: string;
    valueTable: string;
    odds: number;
    estimatedProbability: number;
    match: string;
    market: string;
    selection: string;
    sport: 'Fútbol' | 'Tenis';
  };
  onReset: () => void;
}

function MarkdownTable({ markdown }: { markdown: string }) {
    if (!markdown) return null;
    const rows = markdown.trim().split('\n').map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));
    if (rows.length < 2) return <p>{markdown}</p>;

    const header = rows[0];
    const body = rows.slice(2);

    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full">
                <thead className="bg-muted/50">
                    <tr>
                        {header.map((h, i) => <th key={i} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {body.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/50">
                            {row.map((cell, j) => <td key={j} className="px-4 py-3 whitespace-nowrap text-sm">{cell.replace(/\*\*/g, '')}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function AnalysisResult({ result, onReset }: AnalysisResultProps) {
  const [showStakeCalculator, setShowStakeCalculator] = useState(false);

  const stakeData = {
    probability: result.estimatedProbability,
    odds: result.odds,
    match: result.match,
    market: result.market,
    selection: result.selection,
    sport: result.sport
  }

  if (showStakeCalculator) {
    return <StakeCalculator stakeData={stakeData} onBack={() => setShowStakeCalculator(false)} />
  }

  return (
    <div>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Análisis Completado</AlertTitle>
          <AlertDescription>
            {result.analysis}
          </AlertDescription>
        </Alert>
        
        <h3 className="text-lg font-semibold">Tabla de Valor</h3>
        <MarkdownTable markdown={result.valueTable} />
      
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onReset}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nuevo Análisis
        </Button>
        <Button onClick={() => setShowStakeCalculator(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Calcular Stake
        </Button>
      </CardFooter>
    </div>
  )
}
