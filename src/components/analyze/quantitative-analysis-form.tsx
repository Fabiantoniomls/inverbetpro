"use client"

import { useState } from 'react'
import { CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { AnalysisResult } from './analysis-result'
import { quantitativeAnalysis, QuantitativeAnalysisInput } from '@/ai/flows/quantitative-analysis'
import { useToast } from '@/hooks/use-toast'

export function QuantitativeAnalysisForm() {
  const [url, setUrl] = useState('https://fbref.com/en/matches/')
  const [modelType, setModelType] = useState<'Poisson-xG' | 'Elo'>('Poisson-xG')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)
    
    try {
      const input: QuantitativeAnalysisInput = { url, modelType };
      const analysisResult = await quantitativeAnalysis(input);
      
      const homeWinProb = analysisResult.realProbabilities.homeWin || 0;
      const odds = 1 / homeWinProb;

      setResult({
        analysis: `El modelo ${modelType} ha analizado los datos. La probabilidad real de victoria local es del ${(homeWinProb * 100).toFixed(2)}%.`,
        valueTable: analysisResult.valueTable,
        odds: isFinite(odds) ? odds : 2.0,
        estimatedProbability: homeWinProb,
        // Pass necessary info for saving the bet
        match: `Análisis Cuantitativo de ${url.substring(0, 50)}...`,
        market: "Análisis de Modelo",
        selection: "Victoria Local (Estimada)",
        sport: modelType === 'Poisson-xG' ? 'Fútbol' : 'Tenis'
      });

    } catch (error) {
      console.error("Error running quantitative analysis:", error);
      toast({
        variant: 'destructive',
        title: 'Error en el Análisis',
        description: 'No se pudo completar el análisis cuantitativo. Comprueba la URL y vuelve a intentarlo.',
      });
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    return <AnalysisResult result={result} onReset={() => setResult(null)} />
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL de la Fuente de Datos</Label>
          <Input id="url" type="url" placeholder="https://fbref.com/en/matches/..." value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modelType">Modelo Estadístico</Label>
          <Select name="modelType" value={modelType} onValueChange={(value) => setModelType(value as 'Poisson-xG' | 'Elo')}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Poisson-xG">Poisson-xG (Fútbol)</SelectItem>
              <SelectItem value="Elo">Elo (Tenis)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Analizar
        </Button>
      </CardFooter>
    </form>
  )
}
