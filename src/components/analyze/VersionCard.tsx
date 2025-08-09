"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalysisVersion, Pick } from '@/lib/types/analysis';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Trash2, Bot, Loader2, ChevronsUpDown, Send } from 'lucide-react';
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
import { counterAnalysis } from '@/ai/flows/counter-analysis';
import { deconstructArguments } from '@/ai/flows/deconstruct-arguments';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Timestamp, doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { extractPicks } from '@/ai/flows/extract-picks';
import { ExtractPicksModal } from './ExtractPicksModal';
import { ValueBetsTable } from './value-bets-table';


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

interface VersionCardProps {
    version: AnalysisVersion;
    analysisId: string;
}

export function VersionCard({ version, analysisId }: VersionCardProps) {
    const { toast } = useToast();
    const [isLoadingCounter, setIsLoadingCounter] = useState(false);
    const [isLoadingPicks, setIsLoadingPicks] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showCounterInput, setShowCounterInput] = useState(false);
    const [externalAnalysis, setExternalAnalysis] = useState('');
    const [extractedPicks, setExtractedPicks] = useState<Pick[] | null>(null);

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
        try {
            // Step 1: Deconstruct both analyses into logical components
            const deconstructedData = await deconstructArguments({
                inverapuestasAnalysis: version.contentMarkdown,
                externalAnalysis: externalAnalysis,
            });

            // Step 2: Pass the structured data to the counter-analysis flow
            const { counterAnalysis: result } = await counterAnalysis(deconstructedData);

            // Step 3: Extract picks from the new counter-analysis to save them
            const { picks } = await extractPicks({ analysisContent: result });

            // Step 4: Save this as a new version
             const versionsCollectionRef = collection(db, 'savedAnalyses', analysisId, 'versions');
             const newVersionData = {
                analysisId: analysisId,
                author: "ai" as const,
                authorId: 'iaedge-model',
                contentMarkdown: result,
                createdAt: serverTimestamp(),
                type: "interpelacion" as const,
                deleted: false,
                picks: picks || [],
             };
             await addDoc(versionsCollectionRef, newVersionData);

            toast({
                title: 'Contra-Análisis Guardado',
                description: 'Se ha guardado una nueva versión con la opinión de "iaedge".',
            });
            
            // Reset state
            setShowCounterInput(false);
            setExternalAnalysis('');
            
        } catch (error) {
            console.error("Error fetching counter-analysis:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo obtener la segunda opinión. Es posible que el texto sea demasiado largo o complejo.',
            });
        } finally {
            setIsLoadingCounter(false);
        }
    };
    
    const handleExtractPicks = async () => {
        setIsLoadingPicks(true);
        setExtractedPicks(null);
        try {
            // First, try to use the picks already stored in the version
            if (version.picks && version.picks.length > 0) {
                setExtractedPicks(version.picks);
                return;
            }
            // If not available, extract them from the markdown
            const { picks } = await extractPicks({ analysisContent: version.contentMarkdown });
            if (picks && picks.length > 0) {
                setExtractedPicks(picks);
            } else {
                toast({
                    title: 'No se encontraron picks',
                    description: 'La IA no pudo identificar apuestas concretas en este análisis.',
                });
            }
        } catch (error) {
             console.error("Error extracting picks:", error);
            toast({
                variant: 'destructive',
                title: 'Error de Extracción',
                description: 'No se pudieron extraer los picks del análisis.',
            });
        } finally {
            setIsLoadingPicks(false);
        }
    }
    
    const handleDeleteVersion = async () => {
        setIsDeleting(true);
        try {
            const versionRef = doc(db, 'savedAnalyses', analysisId, 'versions', version.id);
            await updateDoc(versionRef, {
                deleted: true,
            });
            toast({
                title: 'Versión Eliminada',
                description: 'La versión del análisis ha sido eliminada.',
            });
            // The timeline will update automatically
        } catch (error) {
            console.error("Error deleting version:", error);
            toast({
                variant: 'destructive',
                title: 'Error al eliminar',
                description: 'No se pudo eliminar la versión.',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (version.deleted) {
        return null;
    }

    return (
        <>
        {extractedPicks && (
            <ExtractPicksModal
                isOpen={!!extractedPicks}
                onClose={() => setExtractedPicks(null)}
                picks={extractedPicks}
                analysisId={analysisId}
                versionId={version.id}
            />
        )}
        <Card className="border-border/80">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg capitalize">Versión: {version.type}</CardTitle>
                        <CardDescription>
                            {version.author} - {createdAtDate ? format(createdAtDate, "d 'de' MMMM, HH:mm", { locale: es }) : 'fecha desconocida'}
                        </CardDescription>
                    </div>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={isDeleting || version.type === 'original'}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar esta versión?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción marcará la versión como eliminada. La versión original de un análisis no puede ser eliminada.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteVersion}>
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {version.contentMarkdown}
                    </ReactMarkdown>
                </div>

                {version.picks && version.picks.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Tabla de Apuestas de Valor</h3>
                        <ValueBetsTable data={version.picks} />
                    </div>
                )}

                 {version.type !== 'interpelacion' && (
                    <>
                        <div className="mt-6 border-t pt-4">
                            {!showCounterInput && (
                                <Button onClick={() => setShowCounterInput(true)} variant="outline" size="sm">
                                    <ChevronsUpDown className="mr-2 h-4 w-4" />
                                    Contrastar con Análisis Externo
                                </Button>
                            )}

                            {showCounterInput && (
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
                                            {isLoadingCounter ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                            Generar y Guardar Interpelación
                                        </Button>
                                        <Button onClick={() => setShowCounterInput(false)} variant="ghost" size="sm" disabled={isLoadingCounter}>Cancelar</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                 )}
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
                 <Button onClick={handleExtractPicks} size="sm" disabled={isLoadingPicks}>
                    {isLoadingPicks ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    Extraer Picks
                 </Button>
            </CardFooter>
        </Card>
        </>
    );
}
