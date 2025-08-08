import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FundamentalAnalysisForm } from "@/components/analyze/fundamental-analysis-form"
import { QuantitativeAnalysisForm } from "@/components/analyze/quantitative-analysis-form"
import { ImageAnalysisUploader } from "@/components/analyze/image-analysis-uploader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit, Calculator } from "lucide-react"

export default function AnalyzePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Motor de Análisis</h1>
        <p className="text-muted-foreground">
          Sube una captura de pantalla de tu cupón de apuestas y obtén un análisis de valor para todos los partidos visibles.
        </p>
      </div>
      
      {/* Main Feature: Image Analysis */}
      <Card className="shadow-lg border-primary/20">
          <CardContent className="p-6">
              <ImageAnalysisUploader />
          </CardContent>
      </Card>
      
      {/* Secondary Analysis Methods */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="other-methods">
          <AccordionTrigger>¿Prefieres analizar un solo partido manualmente?</AccordionTrigger>
          <AccordionContent>
            <div className="grid md:grid-cols-2 gap-8 pt-4">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

    </div>
  )
}
