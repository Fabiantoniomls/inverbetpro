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
import { DollarSign, Percent, Target, Hash, Scale, TrendingUp, Sparkles } from "lucide-react";
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


export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiSummary, setKpiSummary] = useState<string | null>(null);
  const [chartSummary, setChartSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      if (!loading) setLoading(true);
      return;
    }

    setLoading(true);
    const betsRef = collection(db, 'bets');
    const q = query(betsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const betsData = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          createdAt: (docData.createdAt as Timestamp)?.toDate() ?? new Date(),
        } as Bet;
      });
      setBets(betsData);
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
    // Note: currentBankroll should ideally come from user settings, but we can estimate it
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
           // Do not show toast for this, as it's a non-critical enhancement
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
  
  if (bets.length === 0) {
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
      
      {kpiSummary && (
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
          <PerformanceChart data={chartData} analysis={chartSummary} />
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
