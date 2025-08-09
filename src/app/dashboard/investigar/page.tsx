
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

export default function InvestigatePage() {
  return (
    <div className="space-y-8">
       <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Centro de Investigación</h1>
            <p className="text-muted-foreground">
                Consulta la base de datos local para obtener estadísticas sobre equipos y tomar decisiones informadas.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Asistente de Investigación</CardTitle>
                <CardDescription>
                    Próximamente: una interfaz de chat para hacer preguntas en lenguaje natural a la IA.
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
  )
}
