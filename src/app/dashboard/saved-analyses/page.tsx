"use client"

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SavedAnalysis } from '@/lib/types/analysis';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDocs, Timestamp, writeBatch } from 'firebase/firestore';
import AnalysisTimeline from '@/components/analyze/AnalysisTimeline';


interface AnalysisCardProps {
    analysis: SavedAnalysis;
    onDelete: (id: string) => void;
}

function AnalysisCard({ analysis, onDelete }: AnalysisCardProps) {
    const createdAtDate = analysis.createdAt instanceof Timestamp ? analysis.createdAt.toDate() : analysis.createdAt;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">{analysis.title}</CardTitle>
                <CardDescription>
                    Creado el {createdAtDate ? format(createdAtDate, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es }) : 'fecha desconocida'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AnalysisTimeline analysisId={analysis.id} />
            </CardContent>
            <CardFooter>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Proyecto
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro de eliminar todo el proyecto?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el análisis y todas sus versiones.
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
            </CardFooter>
        </Card>
    );
}


export default function SavedAnalysesPage() {
    const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            if (!loading) setLoading(true);
            return;
        }

        setLoading(true);
        const analysesRef = collection(db, 'savedAnalyses');
        const q = query(analysesRef, where('userId', '==', user.uid), where('deleted', '!=', true), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const analysesData = querySnapshot.docs.map(doc => {
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: (doc.data().createdAt as Timestamp)?.toDate() ?? new Date(),
                } as SavedAnalysis;
            });
            setAnalyses(analysesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching analyses from Firestore:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los análisis.' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const deleteAnalysis = useCallback(async (id: string) => {
        if (!user) return;
        try {
             const batch = writeBatch(db);
             const analysisRef = doc(db, 'savedAnalyses', id);

             // Find all versions in the subcollection to delete them
             const versionsRef = collection(db, 'savedAnalyses', id, 'versions');
             const versionsSnapshot = await getDocs(versionsRef);
             versionsSnapshot.forEach((doc) => {
                 batch.delete(doc.ref);
             });

             // Delete the main analysis document
             batch.delete(analysisRef);
             await batch.commit();

            toast({
                title: 'Análisis Eliminado',
                description: 'El análisis y todas sus versiones han sido eliminados.',
            });
            // The onSnapshot listener will automatically update the UI
        } catch (error) {
            console.error("Error deleting analysis from Firestore:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo eliminar el análisis.',
            });
        }
    }, [toast, user]);


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
    
    if (!user) {
        return (
             <div className="space-y-8 text-center">
                 <h1 className="text-3xl font-bold tracking-tight">Análisis Guardados</h1>
                 <p className="text-muted-foreground">Revisa, gestiona y mejora tus análisis guardados.</p>
                <div className="mt-12">
                    <h3 className="text-xl font-semibold">Inicia sesión para ver tus análisis</h3>
                    <p className="text-muted-foreground mt-2">
                        Aquí aparecerán todos los análisis que guardes.
                    </p>
                </div>
            </div>
        )
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
                Contrasta tus análisis guardados con información de otras fuentes para una decisión más robusta.
            </p>
            <div className="space-y-6">
                {analyses.map(analysis => (
                   <AnalysisCard key={analysis.id} analysis={analysis} onDelete={deleteAnalysis} />
                ))}
            </div>
        </div>
    );
}