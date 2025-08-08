import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FundamentalAnalysisForm } from "@/components/analyze/fundamental-analysis-form"
import { QuantitativeAnalysisForm } from "@/components/analyze/quantitative-analysis-form"
import { ImageAnalysisUploader } from "@/components/analyze/image-analysis-uploader"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit, Calculator, Image as ImageIcon } from "lucide-react"

export default function AnalyzePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Motor de Análisis</h1>
        <p className="text-muted-foreground">
          Sube una captura de pantalla de tu cupón de apuestas y obtén un análisis de valor para todos los partidos visibles.
        </p>
      </div>
      
      <Tabs defaultValue="capture" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="capture">
            <ImageIcon className="mr-2 h-4 w-4" />
            Analizar con Captura
          </TabsTrigger>
          <TabsTrigger value="manual">
             <BrainCircuit className="mr-2 h-4 w-4" />
            Análisis Manual
          </TabsTrigger>
        </TabsList>
        <TabsContent value="capture" className="mt-6">
            <ImageAnalysisUploader />
        </TabsContent>
        <TabsContent value="manual" className="mt-6">
           <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <CardTitle>Análisis Fundamental</CardTitle>
                  </div>
                  <CardDescription>
                    Introduce manualmente los datos para un análisis experto por IA.
                  </CardDescription>
                </CardHeader>
                <FundamentalAnalysisForm />
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-primary" />
                    <CardTitle>Análisis Cuantitativo</CardTitle>
                  </div>
                  <CardDescription>
                    Pega una URL de una fuente de datos para un análisis estadístico.
                  </CardDescription>
                </CardHeader>
                <QuantitativeAnalysisForm />
              </Card>
            </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
