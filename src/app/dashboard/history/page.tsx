import { DataTable } from '@/components/history/data-table'
import { columns } from '@/components/history/columns'
import type { Bet } from '@/lib/types'
import { Timestamp } from 'firebase/firestore'

// Placeholder data, to be fetched from a Genkit flow
async function getBets(): Promise<Bet[]> {
  const now = new Date();
  return [
    { id: '1', userId: 'abc', sport: 'Fútbol', match: 'Real Madrid vs FC Barcelona', market: 'Victoria Local', odds: 2.20, stake: 25, status: 'Ganada', valueCalculated: 0.12, estimatedProbability: 55, profitOrLoss: 30.00, createdAt: Timestamp.fromDate(new Date(now.setDate(now.getDate() - 2))) },
    { id: '2', userId: 'abc', sport: 'Tenis', match: 'Carlos Alcaraz vs Jannik Sinner', market: 'Gana Alcaraz', odds: 1.85, stake: 50, status: 'Ganada', valueCalculated: 0.08, estimatedProbability: 60, profitOrLoss: 42.50, createdAt: Timestamp.fromDate(new Date(now.setDate(now.getDate() - 5))) },
    { id: '3', userId: 'abc', sport: 'Fútbol', match: 'Liverpool vs Manchester City', market: 'Más de 2.5 Goles', odds: 1.72, stake: 20, status: 'Perdida', valueCalculated: 0.05, estimatedProbability: 62, profitOrLoss: -20.00, createdAt: Timestamp.fromDate(new Date(now.setDate(now.getDate() - 7))) },
    { id: '4', userId: 'abc', sport: 'Fútbol', match: 'Bayern Munich vs Borussia Dortmund', market: 'Victoria Visitante', odds: 4.50, stake: 10, status: 'Pendiente', valueCalculated: -0.02, estimatedProbability: 20, profitOrLoss: 0, createdAt: Timestamp.fromDate(new Date(now.setDate(now.getDate() - 1))) },
    { id: '5', userId: 'abc', sport: 'Tenis', match: 'Iga Swiatek vs Aryna Sabalenka', market: 'Gana Sabalenka', odds: 2.50, stake: 15, status: 'Pendiente', valueCalculated: 0.1, estimatedProbability: 44, profitOrLoss: 0, createdAt: Timestamp.now() },
  ]
}

export default async function HistoryPage() {
  const data = await getBets()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Historial de Apuestas</h1>
      <p className="text-muted-foreground">
        Aquí puedes ver y gestionar todas tus apuestas registradas.
      </p>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
