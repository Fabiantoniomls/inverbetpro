import { KpiCard } from "@/components/dashboard/kpi-card";
import { PerformanceChart, type ChartData } from "@/components/dashboard/performance-chart";
import { DollarSign, Percent, Target, Hash, Scale, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Placeholder data, will be fetched from Firestore via a Genkit flow
const kpiData = {
  totalProfitLoss: 2150.75,
  yield: 12.5,
  winRate: 58.3,
  totalBets: 120,
  avgStake: 15.50,
  avgOdds: 2.15,
}

const chartData: ChartData[] = [
  { date: 'Ene', cumulativeProfit: 0 },
  { date: 'Feb', cumulativeProfit: 200 },
  { date: 'Mar', cumulativeProfit: 150 },
  { date: 'Abr', cumulativeProfit: 450 },
  { date: 'May', cumulativeProfit: 500 },
  { date: 'Jun', cumulativeProfit: 700 },
  { date: 'Jul', cumulativeProfit: 950 },
  { date: 'Ago', cumulativeProfit: 1200 },
  { date: 'Sep', cumulativeProfit: 1500 },
  { date: 'Oct', cumulativeProfit: 1800 },
  { date: 'Nov', cumulativeProfit: 2050 },
  { date: 'Dic', cumulativeProfit: 2150.75 },
];

const recentBets = [
    { match: 'Real Madrid vs FC Barcelona', market: 'Victoria Local', odds: 2.20, stake: 25, status: 'Ganada', profit: 30.00 },
    { match: 'Carlos Alcaraz vs Jannik Sinner', market: 'Gana Alcaraz', odds: 1.85, stake: 50, status: 'Ganada', profit: 42.50 },
    { match: 'Liverpool vs Manchester City', market: 'Más de 2.5 Goles', odds: 1.72, stake: 20, status: 'Perdida', profit: -20.00 },
    { match: 'Bayern Munich vs Borussia Dortmund', market: 'Victoria Visitante', odds: 4.50, stake: 10, status: 'Pendiente', profit: 0 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard de Rendimiento</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Ganancia / Pérdida Total" value={`$${kpiData.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} description="Beneficio neto de todas las apuestas." />
        <KpiCard title="Yield" value={`${kpiData.yield}%`} icon={TrendingUp} description="Retorno sobre la inversión total." />
        <KpiCard title="% Acierto" value={`${kpiData.winRate}%`} icon={Target} description="Porcentaje de apuestas ganadas." />
        <KpiCard title="Nº Total de Apuestas" value={kpiData.totalBets.toString()} icon={Hash} description="Número total de apuestas realizadas." />
        <KpiCard title="Stake Medio" value={`$${kpiData.avgStake.toFixed(2)}`} icon={Scale} description="Cantidad media apostada por operación." />
        <KpiCard title="Cuota Media" value={kpiData.avgOdds.toFixed(2)} icon={Percent} description="Cuota media de las apuestas." />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <PerformanceChart data={chartData} />
        </div>
        <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                    <CardTitle>Apuestas Recientes</CardTitle>
                    <CardDescription>
                        Tus últimas 5 apuestas registradas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Partido</TableHead>
                                <TableHead className="text-right">Estado</TableHead>
                                <TableHead className="text-right">Beneficio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentBets.map((bet, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="font-medium">{bet.match}</div>
                                        <div className="text-sm text-muted-foreground">{bet.market}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bet.status === 'Ganada' ? 'bg-green-900/50 text-green-400' : bet.status === 'Perdida' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                            {bet.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${bet.profit > 0 ? 'text-green-400' : bet.profit < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                        {bet.profit > 0 ? `+$${bet.profit.toFixed(2)}` : bet.profit < 0 ? `-$${Math.abs(bet.profit).toFixed(2)}` : `$${bet.profit.toFixed(2)}`}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
