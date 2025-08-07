
"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SavedAnalysis } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Trash2, Bot, Loader2 } from 'lucide-react';
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

interface AnalysisCardProps {
    analysis: SavedAnalysis;
    onDelete: (id: string) => void;
}

function AnalysisCard({ analysis, onDelete }: AnalysisCardProps) {
    const { toast } = useToast();
    const [isLoadingCounter, setIsLoadingCounter] = useState(false);
    const [counterResult, setCounterResult] = useState<string | null>(null);
    const { introduction, detailedAnalysis, valueTableAndRecs } = getAnalysisParts(analysis.content);

    const handleCounterAnalysis = async () => {
        setIsLoadingCounter(true);
        setCounterResult(null);
        try {
            const { counterAnalysis: result } = await counterAnalysis({ originalAnalysis: analysis.content });
            setCounterResult(result);
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">{analysis.title}</CardTitle>
                <CardDescription>
                    Guardado el {format(analysis.createdAt, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
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

                {isLoadingCounter && (
                     <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <p className="text-sm font-medium">"iaedge" está contrastando el análisis...</p>
                        </div>
                        <Skeleton className="h-32 w-full" />
                    </div>
                )}
                
                {counterResult && (
                    <div className="space-y-4 pt-6 border-t mt-4">
                        <Alert variant="default" className="border-blue-500 bg-blue-500/10">
                           <Bot className="h-4 w-4 text-blue-500" />
                           <AlertTitle>Contra-Análisis por iaedge</AlertTitle>
                           <AlertDescription>
                               Aquí tienes una segunda opinión para un análisis más robusto.
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
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el análisis guardado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(analysis.id)}>
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                {!counterResult && (
                    <Button onClick={handleCounterAnalysis} disabled={isLoadingCounter} variant="outline" size="sm">
                        {isLoadingCounter ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Bot className="mr-2 h-4 w-4" />
                        )}
                        Obtener Segunda Opinión
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}


export default function SavedAnalysesPage() {
    const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchAnalyses = () => {
        try {
            const storedAnalyses = localStorage.getItem('savedAnalyses');
            if (storedAnalyses) {
                const parsedAnalyses = JSON.parse(storedAnalyses).map((analysis: any) => ({
                    ...analysis,
                    createdAt: new Date(analysis.createdAt),
                }));
                 // Sort by date descending
                const sortedAnalyses = parsedAnalyses.sort((a: SavedAnalysis, b: SavedAnalysis) => b.createdAt.getTime() - a.createdAt.getTime());
                setAnalyses(sortedAnalyses);
            }
        } catch (error)
        {
            console.error("Error fetching analyses from localStorage:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyses();
    }, []);

    const deleteAnalysis = (id: string) => {
        try {
            const updatedAnalyses = analyses.filter(analysis => analysis.id !== id);
            localStorage.setItem('savedAnalyses', JSON.stringify(updatedAnalyses));
            setAnalyses(updatedAnalyses);
            toast({
                title: 'Análisis Eliminado',
                description: 'El análisis ha sido eliminado correctamente.',
            });
        } catch (error) {
            console.error("Error deleting analysis from localStorage:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo eliminar el análisis.',
            });
        }
    }


    if (loading) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">Análisis Guardados</h1>
                <p className="text-muted-foreground">Revisa, gestiona y mejora tus análisis guardados.</p>
                <div className="space-y-6">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-28 w-full" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-8 w-24" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }
    
    if (analyses.length === 0) {
        return (
            <div className="space-y-8 text-center">
                 <h1 className="text-3xl font-bold tracking-tight">Análisis Guardados</h1>
                 <p className="text-muted-foreground">Revisa, gestiona y mejora tus análisis guardados.</p>
                <div className="mt-12">
                    <h3 className="text-xl font-semibold">No tienes análisis guardados</h3>
                    <p className="text-muted-foreground mt-2">
                        Ve a la sección de 'Analizar' para guardar tu primer análisis.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Análisis Guardados</h1>
            <p className="text-muted-foreground">
                Revisa, gestiona y mejora tus análisis guardados con una segunda opinión de IA.
            </p>
            <div className="space-y-6">
                {analyses.map(analysis => (
                   <AnalysisCard key={analysis.id} analysis={analysis} onDelete={deleteAnalysis} />
                ))}
            </div>
        </div>
    );
}
