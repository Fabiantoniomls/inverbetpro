
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import leaguesData from '@/data/leagues.json';
import { ArrowRight, Trophy, Flame, Newspaper } from "lucide-react";
import Image from 'next/image';
import { FeaturedMarketsTable, type Market } from '@/components/investigate/FeaturedMarketsTable';


interface League {
  name: string;
  url: string;
}

interface CountryLeagues {
  country: string;
  leagues: League[];
}

const typedLeaguesData: CountryLeagues[] = leaguesData as CountryLeagues[];

const popularLeagues = [
    { name: "La Liga", country: "España", url: "https://www.flashscore.cl/futbol/espana/laliga/", logo: "/logos/laliga.png", dataAiHint: "soccer spain" },
    { name: "Premier League", country: "Inglaterra", url: "https://www.flashscore.cl/futbol/inglaterra/premier-league/", logo: "/logos/premier-league.png", dataAiHint: "soccer england" },
    { name: "Serie A", country: "Italia", url: "https://www.flashscore.cl/futbol/italia/serie-a/", logo: "/logos/serie-a.png", dataAiHint: "soccer italy" },
    { name: "Bundesliga", country: "Alemania", url: "https://www.flashscore.cl/futbol/alemania/bundesliga/", logo: "/logos/bundesliga.png", dataAiHint: "soccer germany" },
    { name: "Ligue 1", country: "Francia", url: "https://www.flashscore.cl/futbol/francia/ligue-1/", logo: "/logos/ligue-1.png", dataAiHint: "soccer france" },
];

const popularTournaments = [
    { name: "Australian Open", location: "Melbourne, Australia", dataAiHint: "tennis court" },
    { name: "BNP Paribas Open", location: "Indian Wells, USA", dataAiHint: "tennis hard" },
    { name: "Miami Open", location: "Miami, USA", dataAiHint: "tennis miami" },
    { name: "Rolex Monte-Carlo Masters", location: "Monte-Carlo, Monaco", dataAiHint: "tennis clay" },
    { name: "Mutua Madrid Open", location: "Madrid, Spain", dataAiHint: "tennis madrid" },
    { name: "Internazionali BNL d'Italia", location: "Rome, Italy", dataAiHint: "tennis rome" },
    { name: "Roland Garros", location: "Paris, France", dataAiHint: "tennis paris" },
    { name: "Wimbledon", location: "London, Great Britain", dataAiHint: "tennis grass" },
    { name: "National Bank Open", location: "Toronto, Canada", dataAiHint: "tennis court" },
    { name: "US Open", location: "New York, USA", dataAiHint: "tennis usopen" },
];

const featuredMarkets: Market[] = [
  { match: "Benjamin Bonzi - Lorenzo Musetti", market: "Total de Aces -", selection: "15+", odds1: 3.00, odds2: 3.25 },
  { match: "Benjamin Bonzi - Lorenzo Musetti", market: "Apuesta de Set -", selection: "1-2", odds1: 3.65, odds2: 3.95 },
  { match: "Roman Safiullin - Holger Rune", market: "Apuesta de Set -", selection: "1-2", odds1: 3.70, odds2: 4.00 },
  { match: "Roman Safiullin - Holger Rune", market: "Total de Tie Breaks -", selection: "Más 0.5", odds1: 2.15, odds2: 2.32 },
  { match: "Pedro Martinez Portero - Tommy Paul", market: "Apuesta de Set -", selection: "1-2", odds1: 4.15, odds2: 4.50 },
  { match: "Pedro Martinez Portero - Tommy Paul", market: "Total de Tie Breaks -", selection: "Más 0.5", odds1: 3.10, odds2: 3.35 },
  { match: "Tomas Martin Etcheverry - Felix Auger Aliassime", market: "Total de Aces -", selection: "Tomas Martin Etcheverry : 9+", odds1: 2.77, odds2: 3.00 },
  { match: "Tomas Martin Etcheverry - Felix Auger Aliassime", market: "Apuesta de Set -", selection: "1-2", odds1: 3.70, odds2: 4.00 },
  { match: "Stefanos Tsitsipas - Fabian Marozsan", market: "Total de Aces -", selection: "Stefanos Tsitsipas : 12+", odds1: 2.52, odds2: 2.72 },
  { match: "Stefanos Tsitsipas - Fabian Marozsan", market: "Apuesta de Set -", selection: "2-1", odds1: 4.10, odds2: 4.45 },
  { match: "Jannik Sinner - Daniel Elahi Galan Riveros", market: "Apuesta de Set -", selection: "2-1", odds1: 6.20, odds2: 6.70 },
  { match: "Jannik Sinner - Daniel Elahi Galan Riveros", market: "Total de Tie Breaks -", selection: "Más 0.5", odds1: 5.00, odds2: 5.40 },
  { match: "Tomas Machac - Adrian Mannarino", market: "Total de Aces -", selection: "17+", odds1: 2.65, odds2: 2.87 },
  { match: "Tomas Machac - Adrian Mannarino", market: "Apuesta de Set -", selection: "2-1", odds1: 3.75, odds2: 4.05 },
  { match: "Sebastian Baez - Gabriel Diallo", market: "Apuesta de Set -", selection: "1-2", odds1: 3.70, odds2: 4.00 },
  { match: "Sebastian Baez - Gabriel Diallo", market: "Total de Tie Breaks -", selection: "Más 0.5", odds1: 2.20, odds2: 2.37 },
  { match: "Iga Swiatek - Anastasia Potapova", market: "Total de Aces -", selection: "8+", odds1: 2.40, odds2: 2.60 },
  { match: "Iga Swiatek - Anastasia Potapova", market: "Apuesta de Set -", selection: "2 - 1", odds1: 4.70, odds2: 5.10 },
  { match: "Tatjana Maria - Marta Kostyuk", market: "Apuesta de Set -", selection: "1 - 2", odds1: 3.80, odds2: 4.10 },
];


export default function InvestigatePage() {
  const [sport, setSport] = useState<'football' | 'tennis'>('football');

  return (
    <div className="space-y-8">
       <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Centro de Investigación</h1>
            <p className="text-muted-foreground">
                Explora datos, estadísticas y competiciones para encontrar tu próxima oportunidad de inversión.
            </p>
        </div>
        
        <Tabs defaultValue="football" onValueChange={(value) => setSport(value as any)}>
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="football">Fútbol</TabsTrigger>
                <TabsTrigger value="tennis">Tenis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="football" className="mt-6 space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Flame className="h-6 w-6 text-primary"/>
                            <CardTitle>Ligas Populares</CardTitle>
                        </div>
                        <CardDescription>
                            Acceso rápido a las competiciones de fútbol más importantes del mundo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {popularLeagues.map((league) => (
                             <div key={league.name} className="p-4 border rounded-lg flex flex-col items-center justify-center text-center h-full">
                                <div className="w-16 h-16 mb-4 relative">
                                    <Image src={`https://placehold.co/64x64.png`} data-ai-hint={league.dataAiHint} alt={`${league.name} logo`} width={64} height={64} className="object-contain" />
                                </div>
                                <p className="font-semibold text-sm">{league.name}</p>
                                <p className="text-xs text-muted-foreground">{league.country}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Trophy className="h-6 w-6 text-primary"/>
                            <CardTitle>Índice Completo de Ligas</CardTitle>
                        </div>
                        <CardDescription>
                            Explora la base de datos completa de competiciones de fútbol.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full">
                            {typedLeaguesData.map(({ country, leagues }) => (
                                <AccordionItem value={country} key={country}>
                                    <AccordionTrigger className="text-lg font-semibold">{country}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2 pl-4">
                                            {leagues.map((league) => (
                                                <div key={league.name} className="flex justify-between items-center p-3 rounded-md">
                                                    <span>{league.name}</span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="tennis" className="mt-6 space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Flame className="h-6 w-6 text-primary"/>
                            <CardTitle>Circuito ATP Principal</CardTitle>
                        </div>
                        <CardDescription>
                            Acceso rápido a los torneos más importantes del tenis mundial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {popularTournaments.map((tournament) => (
                            <div key={tournament.name} className="p-4 border rounded-lg flex flex-col items-center justify-center text-center h-full">
                                <div className="w-16 h-16 mb-4 relative">
                                    <Image src={`https://placehold.co/64x64.png`} data-ai-hint={tournament.dataAiHint} alt={`${tournament.name} logo`} width={64} height={64} className="object-contain" />
                                </div>
                                <p className="font-semibold text-sm">{tournament.name}</p>
                                <p className="text-xs text-muted-foreground">{tournament.location}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Newspaper className="h-6 w-6 text-primary"/>
                            <CardTitle>Mercados Destacados del Día</CardTitle>
                        </div>
                        <CardDescription>
                           Una selección de mercados y cuotas para los partidos de mañana.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FeaturedMarketsTable data={featuredMarkets} />
                    </CardContent>
                </Card>

            </TabsContent>
        </Tabs>
    </div>
  )
}
