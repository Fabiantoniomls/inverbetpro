"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalysisVersion } from '@/lib/types/analysis';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Trash2, Bot, Loader2, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { counterAnalysis } from '@/ai/flows/counter-analysis';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Timestamp } from 'firebase/firestore';


// Custom renderer for tables to add ShadCN styling
function MarkdownTable({ children }: { children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-lg border my-4">
            <table className="min-w-full divide-y divide-border">{children}</table>
        </div>
    );
}
function MarkdownTHead({ children }: { children: React.ReactNode }) { return <thead className="bg-muted/50">{children}</thead>; }
function MarkdownTr({ children }: { children: React.ReactNode }) { return <tr className="hover:bg-muted/50">{children}</tr>; }
function MarkdownTh({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{children}</th>; }
function MarkdownTd({ children }: { children: React.ReactNode }) { return <td className="px-4 py-3 whitespace-nowrap text-sm">{children}</td>; }

const markdownComponents = { table: MarkdownTable, thead: MarkdownTHead, tr: MarkdownTr, th: MarkdownTh, td: MarkdownTd };

// Function to split the analysis content
const getAnalysisParts = (content: string) => {
    const detailedAnalysisRegex = /(### Análisis Detallado de Selecciones[\s\S]*?)(?=### Conclusiones Rápidas|### TABLA DE APUESTAS DE VALOR)/;
    const valueTableAndRecsRegex = /(### TABLA DE APUESTAS DE VALOR[\s\S]*)/;
    
    const detailedMatch = content.match(detailedAnalysisRegex);
    const valueTableAndRecsMatch = content.match(valueTableAndRecsRegex);

    return {
        introduction: content.split('###')[0],
        detailedAnalysis: detailedMatch ? detailedMatch[1] : '',
        valueTableAndRecs: valueTableAndRecsMatch ? valueTableAndRecsMatch[1] : ''
    };
};

interface VersionCardProps {
    version: AnalysisVersion;
    analysisId: string;
}

export function VersionCard({ version, analysisId }: VersionCardProps) {
    const { toast } = useToast();
    const [isLoadingCounter, setIsLoadingCounter] = useState(false);
    const [showCounterInput, setShowCounterInput] = useState(false);
    const [externalAnalysis, setExternalAnalysis] = useState('');
    const [counterResult, setCounterResult] = useState<string | null>(null);
    const counterResultRef = useRef<HTMLDivElement>(null);

    const { introduction, detailedAnalysis, valueTableAndRecs } = getAnalysisParts(version.contentMarkdown);
    const createdAtDate = version.createdAt instanceof Timestamp ? version.createdAt.toDate() : version.createdAt;

    const handleGenerateCounterAnalysis = async () => {
        if (!externalAnalysis.trim()) {
            toast({
                variant: 'destructive',
                title: 'Texto requerido',
                description: 'Por favor, pega el análisis externo en el área de texto.',
            });
            return;
        }

        setIsLoadingCounter(true);
        setCounterResult(null);
        try {
            const { counterAnalysis: result } = await counterAnalysis({ 
                originalAnalysis: version.contentMarkdown,
                externalAnalysis: externalAnalysis
            });
            setCounterResult(result);
            // Here you would create a new version in Firestore in a real scenario
        } catch (error) {
            console.error("Error fetching counter-analysis:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo obtener la segunda opinión.',
            });
        } finally {
            setIsLoadingCounter(false);
        }
    };
    
    useEffect(() => {
        if (counterResult) {
            counterResultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [counterResult]);

    return (
        <Card className="border-border/80">
            <CardHeader>
                <CardTitle className="text-lg">Versión del Análisis ({version.type})</CardTitle>
                <CardDescription>
                    {version.author} - {createdAtDate ? format(createdAtDate, "d 'de' MMMM, HH:mm", { locale: es }) : 'fecha desconocida'}
                </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {introduction}
                </ReactMarkdown>
                
                <div className="py-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {valueTableAndRecs}
                    </ReactMarkdown>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-none -mt-4">
                        <AccordionTrigger className="text-sm text-primary hover:no-underline justify-start gap-1 py-2">
                            <span>Ver Análisis Completo</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {detailedAnalysis}
                            </ReactMarkdown>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <div className="mt-6 border-t pt-4">
                    {!showCounterInput && (
                         <Button onClick={() => setShowCounterInput(true)} variant="outline" size="sm">
                            <ChevronsUpDown className="mr-2 h-4 w-4" />
                            Contrastar con Análisis Externo
                        </Button>
                    )}

                    {showCounterInput && !counterResult && (
                        <div className="space-y-4">
                             <Label htmlFor={`external-analysis-${version.id}`}>Pega aquí el análisis de otra fuente para obtener una respuesta crítica de "iaedge"</Label>
                             <Textarea 
                                id={`external-analysis-${version.id}`}
                                value={externalAnalysis}
                                onChange={(e) => setExternalAnalysis(e.target.value)}
                                placeholder="Pega el texto del análisis externo aquí..."
                                rows={8}
                                className="text-xs"
                             />
                             <div className="flex gap-2">
                                <Button onClick={handleGenerateCounterAnalysis} disabled={isLoadingCounter} size="sm">
                                    {isLoadingCounter ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Bot className="mr-2 h-4 w-4" />
                                    )}
                                    Generar Contra-Análisis
                                </Button>
                                <Button onClick={() => setShowCounterInput(false)} variant="ghost" size="sm" disabled={isLoadingCounter}>Cancelar</Button>
                             </div>
                        </div>
                    )}
                </div>

                {isLoadingCounter && !counterResult && (
                     <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <p className="text-sm font-medium">"iaedge" está contrastando ambos análisis...</p>
                        </div>
                        <Skeleton className="h-32 w-full" />
                    </div>
                )}
                
                {counterResult && (
                    <div className="space-y-4 pt-6 border-t mt-4" ref={counterResultRef}>
                        <Alert variant="default" className="border-blue-500 bg-blue-500/10">
                           <Bot className="h-4 w-4 text-blue-500" />
                           <AlertTitle>Síntesis y Contra-Análisis por iaedge</AlertTitle>
                           <AlertDescription>
                               Se ha combinado tu análisis guardado con la información externa proporcionada.
                           </AlertDescription>
                       </Alert>
                       <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                           {counterResult}
                       </ReactMarkdown>
                   </div>
                )}
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={version.type === 'original'}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Versión
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar esta versión?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La versión original no puede ser eliminada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { /* TODO */ }}>
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}
