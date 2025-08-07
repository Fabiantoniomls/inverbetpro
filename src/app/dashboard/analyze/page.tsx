import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FundamentalAnalysisForm } from "@/components/analyze/fundamental-analysis-form"
import { QuantitativeAnalysisForm } from "@/components/analyze/quantitative-analysis-form"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit, Calculator } from "lucide-react"

export default function AnalyzePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Motor de Análisis</h1>
      <p className="text-muted-foreground">
        Utiliza nuestros modelos de análisis para identificar apuestas de valor (+EV).
      </p>
      
      <Tabs defaultValue="fundamental" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="fundamental">
            <BrainCircuit className="mr-2 h-4 w-4" />
            Análisis Fundamental
          </TabsTrigger>
          <TabsTrigger value="quantitative">
            <Calculator className="mr-2 h-4 w-4" />
            Análisis Cuantitativo
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fundamental">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Fundamental</CardTitle>
              <CardDescription>
                Introduce manualmente los datos cualitativos y cuantitativos para un análisis experto por IA.
              </CardDescription>
            </CardHeader>
            <FundamentalAnalysisForm />
          </Card>
        </TabsContent>
        <TabsContent value="quantitative">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Cuantitativo</CardTitle>
              <CardDescription>
                Pega una URL de una fuente de datos (ej. FBref) para un análisis estadístico.
              </CardDescription>
            </CardHeader>
            <QuantitativeAnalysisForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
