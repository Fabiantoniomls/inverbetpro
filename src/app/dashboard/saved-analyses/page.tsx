
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
import { Trash2 } from 'lucide-react';
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
                setAnalyses(parsedAnalyses);
            }
        } catch (error) {
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
                <p className="text-muted-foreground">Revisa, gestiona y elimina tus análisis guardados.</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
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
                 <p className="text-muted-foreground">Revisa, gestiona y elimina tus análisis guardados.</p>
                <div className="mt-12">
                    <h3 className="text-xl font-semibold">No tienes análisis guardados</h3>
                    <p className="text-muted-foreground mt-2">
                        Ve a la sección de 'Analizar Apuesta' para guardar tu primer análisis.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Análisis Guardados</h1>
            <p className="text-muted-foreground">
                Revisa, gestiona y elimina tus análisis guardados.
            </p>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {analyses.map(analysis => (
                    <Card key={analysis.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-xl">{analysis.title}</CardTitle>
                            <CardDescription>
                                Guardado el {format(analysis.createdAt, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {analysis.content}
                            </ReactMarkdown>
                        </CardContent>
                        <CardFooter>
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
                                  <AlertDialogAction onClick={() => deleteAnalysis(analysis.id)}>
                                    Sí, eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
