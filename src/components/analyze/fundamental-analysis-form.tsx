"use client"

import { useState } from 'react'
import { CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { AnalysisResult } from './analysis-result'
import { fundamentalAnalysis } from '@/ai/flows/fundamental-analysis'
import { useToast } from '@/hooks/use-toast'


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
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)
    
    try {
      const analysisInput = {
        ...formData,
        odds: parseFloat(formData.odds),
        impliedProbability: parseFloat(formData.impliedProbability)
      }
      const analysisResult = await fundamentalAnalysis(analysisInput);
      
      const valueRow = analysisResult.valueTable.split('\n').find(row => row.includes('**Apostar**'));
      let estimatedProbability = 0;
      if (valueRow) {
        const cells = valueRow.split('|').map(c => c.trim());
        const probCell = cells[2];
        if (probCell) {
          const probMatch = probCell.match(/\d+(\.\d+)?/);
          if (probMatch) {
            estimatedProbability = parseFloat(probMatch[0]) / 100;
          }
        }
      }

      setResult({
        ...analysisResult,
        odds: analysisInput.odds,
        estimatedProbability: estimatedProbability || 0.5,
      })
    } catch (error) {
      console.error("Error running fundamental analysis: ", error);
      toast({
        variant: 'destructive',
        title: 'Error en el Análisis',
        description: 'No se pudo completar el análisis. Inténtalo de nuevo.'
      })
    } finally {
      setIsLoading(false)
    }
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
