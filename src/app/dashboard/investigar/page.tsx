
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import leaguesData from '@/data/leagues.json';
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface League {
  name: string;
  url: string;
}

interface CountryLeagues {
  country: string;
  leagues: League[];
}

const typedLeaguesData: CountryLeagues[] = leaguesData as CountryLeagues[];

export default function InvestigatePage() {
  return (
    <div className="space-y-8">
       <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Centro de Investigación</h1>
            <p className="text-muted-foreground">
                Explora las principales ligas y competiciones para encontrar tu próxima oportunidad de inversión.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Índice de Ligas</CardTitle>
                <CardDescription>
                    Base de datos de competiciones de fútbol disponibles para análisis.
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
                                        <Link href={league.url} target="_blank" rel="noopener noreferrer" key={league.name} 
                                              className="flex justify-between items-center p-3 rounded-md hover:bg-muted transition-colors">
                                            <span>{league.name}</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </Link>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    </div>
  )
}
