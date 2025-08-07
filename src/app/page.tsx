import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart, Calculator, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 22V12"/><path d="M12 12V2L18 5l-6 3"/><path d="M12 12V2L6 5l6 3"/><path d="M1 12h10"/><path d="M23 12h-10"/></svg>
            <h1 className="text-2xl font-bold font-headline">Inverapuestas Pro</h1>
          </div>
          <nav>
            <Link href="/dashboard">
              <Button>
                Entrar a la App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">
              Transforma las Apuestas de Azar en Inversiones Cuantitativas.
            </h2>
            <p className="text-lg text-muted-foreground">
              Inverapuestas Pro es tu plataforma para identificar apuestas de valor (+EV),
              gestionar tu capital con disciplina y visualizar tu rendimiento a largo plazo.
              Deja de apostar, empieza a invertir.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Comienza tu Análisis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FeatureCard
              icon={<BrainCircuit className="h-8 w-8 text-primary" />}
              title="Análisis Fundamental"
              description="Introduce datos cualitativos y cuantitativos para obtener un análisis experto generado por IA."
            />
            <FeatureCard
              icon={<Calculator className="h-8 w-8 text-primary" />}
              title="Análisis Cuantitativo"
              description="Utiliza modelos estadísticos para calcular probabilidades reales y encontrar valor en el mercado."
            />
            <FeatureCard
              icon={<BarChart className="h-8 w-8 text-primary" />}
              title="Dashboard de Rendimiento"
              description="Visualiza tu progreso con KPIs detallados y un gráfico de rendimiento histórico."
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M12 22V12"/><path d="M12 12V2L18 5l-6 3"/><path d="M12 12V2L6 5l6 3"/><path d="M1 12h10"/><path d="M23 12h-10"/></svg>}
              title="Gestión de Capital"
              description="Calcula el stake óptimo para cada apuesta usando modelos como el Criterio de Kelly."
            />
          </div>
        </div>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Inverapuestas Pro. Todos los derechos reservados.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
