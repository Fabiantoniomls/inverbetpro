"use client"

import { useState } from 'react'
import { CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { AnalysisResult } from './analysis-result'

// Mock server action for development. In production this would call the Genkit flow.
const runQuantitativeAnalysis = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
        analysis: "El modelo Poisson-xG, basado en los datos de xG extraídos, sugiere una probabilidad de victoria local superior a la implícita en las cuotas. Se ha identificado una apuesta de valor.",
        valueTable: `
| Outcome         | Real Probability | Implied Probability | Odds | Value         |
|-----------------|------------------|---------------------|------|---------------|
| Home Win        | 52%              | 45.45%              | 2.20 | **+EV (Value)** |
| Draw            | 25%              | 28.57%              | 3.50 | -EV             |
| Away Win        | 23%              | 29.41%              | 3.40 | -EV             |
`,
        odds: 2.20,
        estimatedProbability: 0.52,
    };
}

export function QuantitativeAnalysisForm() {
  const [url, setUrl] = useState('https://fbref.com/en/matches/...')
  const [modelType, setModelType] = useState('Poisson-xG')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)
    const analysisResult = await runQuantitativeAnalysis({ url, modelType });
    setResult(analysisResult)
    setIsLoading(false)
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
          <Select name="modelType" value={modelType} onValueChange={setModelType}>
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
