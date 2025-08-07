"use client"

import { useState } from 'react'
import { CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { AnalysisResult } from './analysis-result'

// Mock server action for development. In production this would call the Genkit flow.
const runFundamentalAnalysis = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
        analysis: "Basado en el análisis de fortalezas y debilidades, el Equipo A tiene una ligera ventaja. Su defensa sólida podría neutralizar el ataque del Equipo B. Sin embargo, el jugador clave del Equipo B está en un momento de forma excepcional y podría ser un factor decisivo.",
        valueTable: `
| Apuesta Potencial         | Prob. Estimada | Prob. Implícita | Cuota | EV (Valor Esperado) | Decisión          |
|---------------------------|----------------|-----------------|-------|---------------------|-------------------|
| Victoria Equipo A         | 55%            | 45.45%          | 2.20  | +0.212              | **Apostar**       |
| Empate                    | 25%            | 28.57%          | 3.50  | -0.125              | No Apostar        |
| Victoria Equipo B         | 20%            | 29.41%          | 3.40  | -0.320              | No Apostar        |
        `,
        odds: data.odds,
        estimatedProbability: 0.55,
    };
}


export function FundamentalAnalysisForm() {
  const [formData, setFormData] = useState({
    matchDescription: 'Real Madrid vs FC Barcelona',
    teamAStrengths: 'Transiciones rápidas, defensa sólida',
    teamAWeaknesses: 'Vulnerable a contraataques',
    teamBStrengths: 'Control de la posesión, presión alta',
    teamBWeaknesses: 'Defensa lenta',
    keyPlayerTeamA: 'Vinícius Júnior',
    keyPlayerTeamB: 'Robert Lewandowski',
    odds: '2.20',
    impliedProbability: '45.45'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)
    const analysisInput = {
      ...formData,
      odds: parseFloat(formData.odds),
      impliedProbability: parseFloat(formData.impliedProbability)
    }
    const analysisResult = await runFundamentalAnalysis(analysisInput);
    setResult(analysisResult)
    setIsLoading(false)
  }

  if (result) {
    return <AnalysisResult result={result} onReset={() => setResult(null)} />
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="matchDescription">Descripción del Partido</Label>
                <Input id="matchDescription" name="matchDescription" placeholder="Ej: Real Madrid vs FC Barcelona" value={formData.matchDescription} onChange={handleChange} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="keyPlayerTeamA">Jugador Clave Equipo A</Label>
                <Input id="keyPlayerTeamA" name="keyPlayerTeamA" placeholder="Ej: Vinícius Júnior" value={formData.keyPlayerTeamA} onChange={handleChange} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="keyPlayerTeamB">Jugador Clave Equipo B</Label>
                <Input id="keyPlayerTeamB" name="keyPlayerTeamB" placeholder="Ej: Robert Lewandowski" value={formData.keyPlayerTeamB} onChange={handleChange} required />
            </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="teamAStrengths">Fortalezas Equipo A</Label>
            <Textarea id="teamAStrengths" name="teamAStrengths" placeholder="Ej: Transiciones rápidas, defensa sólida" value={formData.teamAStrengths} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamAWeaknesses">Debilidades Equipo A</Label>
            <Textarea id="teamAWeaknesses" name="teamAWeaknesses" placeholder="Ej: Vulnerable a contraataques, balón parado" value={formData.teamAWeaknesses} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamBStrengths">Fortalezas Equipo B</Label>
            <Textarea id="teamBStrengths" name="teamBStrengths" placeholder="Ej: Control de la posesión, presión alta" value={formData.teamBStrengths} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamBWeaknesses">Debilidades Equipo B</Label>
            <Textarea id="teamBWeaknesses" name="teamBWeaknesses" placeholder="Ej: Defensa lenta, falta de profundidad" value={formData.teamBWeaknesses} onChange={handleChange} required />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="odds">Cuotas</Label>
                <Input id="odds" name="odds" type="number" step="0.01" placeholder="Ej: 2.20" value={formData.odds} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="impliedProbability">Probabilidad Implícita (%)</Label>
                <Input id="impliedProbability" name="impliedProbability" type="number" step="0.01" placeholder="Ej: 45.45" value={formData.impliedProbability} onChange={handleChange} required />
            </div>
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
