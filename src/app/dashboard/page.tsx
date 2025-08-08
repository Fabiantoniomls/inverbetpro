
"use client"

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import type { Bet } from '@/lib/types';
import { summarizeKpis, type KpiData } from '@/ai/flows/summarize-kpis';
import { summarizePerformanceChart } from '@/ai/flows/summarize-performance-chart';
import { useToast } from '@/hooks/use-toast';

import { KpiCard } from "@/components/dashboard/kpi-card";
import { PerformanceChart, type ChartData } from "@/components/dashboard/performance-chart";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, Percent, Target, Hash, Scale, TrendingUp, Sparkles, TestTube2 } from "lucide-react";
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


const mockBets: Bet[] = [
  { id: '1', userId: 'mock', sport: 'Tenis', match: 'Carlos Alcaraz vs. Novak Djokovic', market: 'Ganador del Partido', selection: 'Carlos Alcaraz', odds: 2.1, stake: 20, status: 'Ganada', valueCalculated: 0.05, estimatedProbability: 50, profitOrLoss: 22, createdAt: new Date('2024-05-01') },
  { id: '2', userId: 'mock', sport: 'Fútbol', match: 'Real Madrid vs. FC Barcelona', market: 'Más/Menos Goles', selection: 'Más de 2.5', odds: 1.85, stake: 25, status: 'Ganada', valueCalculated: 0.1, estimatedProbability: 60, profitOrLoss: 21.25, createdAt: new Date('2024-05-03') },
  { id: '3', userId: 'mock', sport: 'Tenis', match: 'Iga Swiatek vs. Aryna Sabalenka', market: 'Ganador del Partido', selection: 'Aryna Sabalenka', odds: 2.5, stake: 15, status: 'Perdida', valueCalculated: -0.05, estimatedProbability: 42, profitOrLoss: -15, createdAt: new Date('2024-05-05') },
  { id: '4', userId: 'mock', sport: 'Fútbol', match: 'Liverpool vs. Manchester City', market: 'Ambos Equipos Marcan', selection: 'Sí', odds: 1.6, stake: 30, status: 'Ganada', valueCalculated: 0.12, estimatedProbability: 65, profitOrLoss: 18, createdAt: new Date('2024-05-07') },
  { id: '5', userId: 'mock', sport: 'Tenis', match: 'Jannik Sinner vs. Daniil Medvedev', market: 'Ganador del Partido', selection: 'Jannik Sinner', odds: 1.72, stake: 22, status: 'Ganada', valueCalculated: 0.08, estimatedProbability: 60, profitOrLoss: 15.84, createdAt: new Date('2024-05-10') },
  { id: '6', userId: 'mock', sport: 'Fútbol', match: 'Bayern Munich vs. Borussia Dortmund', market: 'Resultado del Partido', selection: 'Bayern Munich', odds: 1.5, stake: 40, status: 'Ganada', valueCalculated: 0.05, estimatedProbability: 66, profitOrLoss: 20, createdAt: new Date('2024-05-12') },
  { id: '7', userId: 'mock', sport: 'Tenis', match: 'Coco Gauff vs. Elena Rybakina', market: 'Ganador del Partido', selection: 'Coco Gauff', odds: 2.0, stake: 18, status: 'Perdida', valueCalculated: -0.1, estimatedProbability: 45, profitOrLoss: -18, createdAt: new Date('2024-05-15') },
  { id: '8', userId: 'mock', sport: 'Fútbol', match: 'AC Milan vs. Inter Milan', market: 'Doble Oportunidad', selection: 'X2', odds: 1.4, stake: 50, status: 'Ganada', valueCalculated: 0.02, estimatedProbability: 70, profitOrLoss: 20, createdAt: new Date('2024-05-18') },
  { id: '9', userId: 'mock', sport: 'Tenis', match: 'Alexander Zverev vs. Stefanos Tsitsipas', market: 'Ganador del Partido', selection: 'Alexander Zverev', odds: 1.9, stake: 20, status: 'Perdida', valueCalculated: 0.01, estimatedProbability: 52, profitOrLoss: -20, createdAt: new Date('2024-05-20') },
  { id: '10', userId: 'mock', sport: 'Fútbol', match: 'Paris Saint-Germain vs. Olympique de Marseille', market: 'Hándicap Asiático', selection: 'PSG -1.5', odds: 2.2, stake: 15, status: 'Ganada', valueCalculated: 0.15, estimatedProbability: 50, profitOrLoss: 18, createdAt: new Date('2024-05-22') },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiSummary, setKpiSummary] = useState<string | null>(null);
  const [chartSummary, setChartSummary] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    if (!user) {
      if (!loading) setLoading(true);
      return;
    }

    setLoading(true);
    setIsMockData(false);
    const betsRef = collection(db, 'bets');
    const q = query(betsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        // If no real data, use mock data
        setBets(mockBets);
        setIsMockData(true);
      } else {
        const betsData = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: (docData.createdAt as Timestamp)?.toDate() ?? new Date(),
          } as Bet;
        });
        setBets(betsData);
        setIsMockData(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bets from Firestore:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las apuestas.' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const kpiData = useMemo(() => {
    const settledBets = bets.filter(b => b.status === 'Ganada' || b.status === 'Perdida');
    const totalStaked = settledBets.reduce((acc, bet) => acc + bet.stake, 0);
    const totalProfitLoss = settledBets.reduce((acc, bet) => acc + bet.profitOrLoss, 0);
    const yieldValue = totalStaked > 0 ? (totalProfitLoss / totalStaked) * 100 : 0;
    const winRate = settledBets.length > 0 ? (settledBets.filter(b => b.status === 'Ganada').length / settledBets.length) * 100 : 0;
    const totalBets = bets.length;
    const avgStake = totalBets > 0 ? bets.reduce((acc, bet) => acc + bet.stake, 0) / totalBets : 0;
    const avgOdds = totalBets > 0 ? bets.reduce((acc, bet) => acc + bet.odds, 0) / totalBets : 0;
    const currentBankroll = 1000 + totalProfitLoss; 

    return {
      totalProfitLoss,
      yield: yieldValue,
      winRate,
      totalBets,
      avgStake,
      avgOdds,
      currentBankroll,
      trend: totalProfitLoss > 0 ? 'up' : totalProfitLoss < 0 ? 'down' : 'flat' as const
    };
  }, [bets]);

  const { format } = require('date-fns');

  const chartData: ChartData[] = useMemo(() => {
    const sortedBets = [...bets]
      .filter(b => b.status !== 'Pendiente')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    let cumulativeProfit = 0;
    return sortedBets.map(bet => {
      cumulativeProfit += bet.profitOrLoss;
      return {
        date: format(bet.createdAt, 'MMM dd'),
        cumulativeProfit: cumulativeProfit
      };
    });
  }, [bets, format]);


  useEffect(() => {
    if (!loading && bets.length > 0) {
      const getSummaries = async () => {
        // KPI Summary
        try {
          const kpiPayload: KpiData = {
              totalProfitLoss: kpiData.totalProfitLoss,
              roi: kpiData.yield,
              winRate: kpiData.winRate,
              currentBankroll: kpiData.currentBankroll,
              trend: kpiData.trend,
          };
          const { summary } = await summarizeKpis({ kpiData: kpiPayload });
          setKpiSummary(summary);
        } catch (error) {
           console.error("Error generating KPI summary:", error);
        }
        
        // Chart Summary
        try {
            const { summary: chartAnalysis } = await summarizePerformanceChart({ performanceData: chartData });
            setChartSummary(chartAnalysis);
        } catch (error) {
            console.error("Error generating chart summary:", error);
        }

      };
      getSummaries();
    }
  }, [loading, bets.length, kpiData, chartData]);

  if (loading) {
    return (
       <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Rendimiento</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="lg:col-span-4 h-96 w-full" />
          <Skeleton className="lg:col-span-3 h-96 w-full" />
        </div>
      </div>
    );
  }
  
  if (bets.length === 0 && !isMockData) {
    return (
        <div className="space-y-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Rendimiento</h1>
            <div className="mt-12">
                <h3 className="text-xl font-semibold">No hay datos aún</h3>
                <p className="text-muted-foreground mt-2">
                    Registra tu primera apuesta desde la sección 'Analizar' o 'Historial' para ver tus estadísticas.
                </p>
            </div>
        </div>
    )
  }

  const recentBets = bets.slice(0, 5);


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard de Rendimiento</h1>
      
      {isMockData && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-950">
          <TestTube2 className="h-4 w-4 text-amber-400" />
          <AlertTitle>Modo de Demostración</AlertTitle>
          <AlertDescription>
            Estás viendo datos de prueba. Registra tu primera apuesta para ver tus propias estadísticas.
          </AlertDescription>
        </Alert>
      )}

      {kpiSummary && !isMockData && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Resumen del Coach</AlertTitle>
          <AlertDescription>{kpiSummary}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Ganancia / Pérdida Total" value={`$${kpiData.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} description="Beneficio neto de todas las apuestas." />
        <KpiCard title="Yield" value={`${kpiData.yield.toFixed(1)}%`} icon={TrendingUp} description="Retorno sobre la inversión total." />
        <KpiCard title="% Acierto" value={`${kpiData.winRate.toFixed(1)}%`} icon={Target} description="Porcentaje de apuestas ganadas." />
        <KpiCard title="Nº Total de Apuestas" value={kpiData.totalBets.toString()} icon={Hash} description="Número total de apuestas realizadas." />
        <KpiCard title="Stake Medio" value={`$${kpiData.avgStake.toFixed(2)}`} icon={Scale} description="Cantidad media apostada por operación." />
        <KpiCard title="Cuota Media" value={kpiData.avgOdds.toFixed(2)} icon={Percent} description="Cuota media de las apuestas." />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <PerformanceChart data={chartData} analysis={isMockData ? "Visualización del rendimiento acumulado de los datos de prueba." : chartSummary} />
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
                            {recentBets.map((bet) => (
                                <TableRow key={bet.id}>
                                    <TableCell>
                                        <div className="font-medium">{bet.match}</div>
                                        <div className="text-sm text-muted-foreground">{bet.market}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bet.status === 'Ganada' ? 'bg-green-900/50 text-green-400' : bet.status === 'Perdida' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                            {bet.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${bet.profitOrLoss > 0 ? 'text-green-400' : bet.profitOrLoss < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                        {bet.profitOrLoss > 0 ? `+$${bet.profitOrLoss.toFixed(2)}` : bet.profitOrLoss < 0 ? `-$${Math.abs(bet.profitOrLoss).toFixed(2)}` : `$${bet.profitOrLoss.toFixed(2)}`}
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

    