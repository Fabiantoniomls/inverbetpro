
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import leaguesData from '@/data/leagues.json';
import { ArrowRight, Trophy, Flame } from "lucide-react";
import Image from 'next/image';
import { FeaturedMatchesTable, type Market } from "@/components/investigate/FeaturedMatchesTable";


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

const featuredMatches: Market[] = [
  { match: "Casper Ruud vs Arthur Rinderknech", odds1: 1.45, odds2: 2.95, selection1: "Casper Ruud", selection2: "Arthur Rinderknech" },
  { match: "Benjamin Bonzi vs Lorenzo Musetti", odds1: 3.20, odds2: 1.39, selection1: "Benjamin Bonzi", selection2: "Lorenzo Musetti" },
  { match: "Roman Safiullin vs Holger Rune", odds1: 3.30, odds2: 1.37, selection1: "Roman Safiullin", selection2: "Holger Rune" },
  { match: "Alex Michelsen vs Corentin Moutet", odds1: 1.90, odds2: 1.98, selection1: "Alex Michelsen", selection2: "Corentin Moutet" },
  { match: "Pedro Martinez Portero vs Tommy Paul", odds1: 7.80, odds2: 1.11, selection1: "Pedro Martinez Portero", selection2: "Tommy Paul" },
  { match: "Tomas Martin Etcheverry vs Felix Auger Aliassime", odds1: 3.00, odds2: 1.44, selection1: "Tomas Martin Etcheverry", selection2: "Felix Auger Aliassime" },
  { match: "Stefanos Tsitsipas vs Fabian Marozsan", odds1: 1.91, odds2: 1.98, selection1: "Stefanos Tsitsipas", selection2: "Fabian Marozsan" },
  { match: "Chak Lam Coleman Wong vs Ugo Humbert", odds1: 2.67, odds2: 1.53, selection1: "Chak Lam Coleman Wong", selection2: "Ugo Humbert" },
  { match: "Jannik Sinner vs Daniel Elahi Galan Riveros", odds1: 1.01, odds2: 24.00, selection1: "Jannik Sinner", selection2: "Daniel Elahi Galan Riveros" },
  { match: "Tomas Machac vs Adrian Mannarino", odds1: 1.57, odds2: 2.52, selection1: "Tomas Machac", selection2: "Adrian Mannarino" },
  { match: "Sebastian Baez vs Gabriel Diallo", odds1: 4.40, odds2: 1.25, selection1: "Sebastian Baez", selection2: "Gabriel Diallo" },
  { match: "Alejandro Davidovich Fokina vs Joao Fonseca", odds1: 1.70, odds2: 2.27, selection1: "Alejandro Davidovich Fokina", selection2: "Joao Fonseca" },
  { match: "Zizou Bergs vs Lorenzo Sonego", odds1: 2.25, odds2: 1.70, selection1: "Zizou Bergs", selection2: "Lorenzo Sonego" },
  { match: "Terence Atmane vs Flavio Cobolli", odds1: 3.95, odds2: 1.29, selection1: "Terence Atmane", selection2: "Flavio Cobolli" },
  { match: "Frances Tiafoe vs Roberto Carballes Baena", odds1: 1.22, odds2: 4.80, selection1: "Frances Tiafoe", selection2: "Roberto Carballes Baena" },
]


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
                            <Trophy className="h-6 w-6 text-primary"/>
                            <CardTitle>Partidos Destacados del Día</CardTitle>
                        </div>
                        <CardDescription>
                            Mercados y cuotas para los partidos más relevantes de la jornada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FeaturedMatchesTable data={featuredMatches} />
                    </CardContent>
                </Card>

            </TabsContent>
        </Tabs>
    </div>
  )
}
