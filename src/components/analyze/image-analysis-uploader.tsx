
"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, ArrowLeft, CheckCircle, Copy, ImageUp, Loader2, Bot, Sparkles, Save, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzeBatchFromImage } from '@/ai/flows/analyze-batch-from-image';
import { counterAnalysis } from '@/ai/flows/counter-analysis';
import { deconstructArguments } from '@/ai/flows/deconstruct-arguments';
import type { AnalyzeBatchFromImageOutput, ExtractedMatch, Pick } from '@/lib/types/analysis';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ValueBetsTable } from './value-bets-table';


const markdownComponents = {
   // We are now using a custom component for the table
   table: () => null,
};

type AnalysisStep = 'upload' | 'extracting' | 'surface' | 'analyzing' | 'result';
type Surface = 'Hard' | 'Clay' | 'Grass' | 'Football';


export function ImageAnalysisUploader() {
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [extractedMatches, setExtractedMatches] = useState<ExtractedMatch[] | null>(null);
  const [surface, setSurface] = useState<Surface | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCounterAnalyzing, setIsCounterAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeBatchFromImageOutput | null>(null);
  const [counterResult, setCounterResult] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();


  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        setPhotoDataUri(dataUri);
        setStep('extracting');
        setIsLoading(true);

        try {
            // First, just extract the matches without analysis
            const extractionResult = await analyzeBatchFromImage({ photoDataUri: dataUri });
            if (extractionResult.extractedMatches && extractionResult.extractedMatches.length > 0) {
                setExtractedMatches(extractionResult.extractedMatches);
                // Check if we can infer surface from tournament
                const tournament = extractionResult.extractedMatches[0]?.tournament?.toLowerCase();
                let inferredSurface: Surface | null = null;
                if(extractionResult.extractedMatches.every(m => m.sport === 'Fútbol')) {
                   inferredSurface = 'Football';
                }
                else if (tournament) {
                    if (tournament.includes('wimbledon')) inferredSurface = 'Grass';
                    else if (['roland garros', 'french open', 'monte-carlo', 'madrid', 'rome'].some(t => tournament.includes(t))) inferredSurface = 'Clay';
                    else if (['australian open', 'us open', 'cincinnati', 'miami', 'indian wells', 'shanghai', 'paris'].some(t => tournament.includes(t))) inferredSurface = 'Hard';
                }
                
                if (inferredSurface) {
                    setSurface(inferredSurface);
                    handleAnalysis(dataUri, inferredSurface, extractionResult.extractedMatches);
                } else {
                    setStep('surface'); // Go to surface step to allow user selection
                }

            } else {
                toast({ variant: 'destructive', title: 'Extracción Fallida', description: 'No se encontraron partidos en la imagen.' });
                handleReset();
            }
        } catch (error) {
            console.error('Error during extraction:', error);
            toast({ variant: 'destructive', title: 'Error de Extracción', description: 'No se pudo procesar la imagen.' });
            handleReset();
        } finally {
            setIsLoading(false);
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast({ variant: 'destructive', title: 'Error de Archivo', description: 'No se pudo leer el archivo de imagen.' });
        handleReset();
      };
    }
  }, [toast]);

  const handleAnalysis = async (
    pdu: string, 
    sfc: Surface, 
    matches: ExtractedMatch[]
  ) => {
    if (!pdu || !sfc || !matches) {
        toast({ variant: 'destructive', title: 'Faltan datos', description: 'Por favor, proporciona una imagen y selecciona una superficie.' });
        return;
    }
    
    setStep('analyzing');
    setIsLoading(true);
    setResult(null);
    setCounterResult(null);

    try {
        const analysisResult = await analyzeBatchFromImage({ photoDataUri: pdu, surface: sfc, extractedMatches: matches });
        setResult(analysisResult);
        setStep('result');
    } catch (error) {
        console.error('Error during image analysis:', error);
        toast({
            variant: 'destructive',
            title: 'Error en el Análisis',
            description: 'No se pudo procesar la imagen. Por favor, inténtalo de nuevo.',
        });
        handleReset();
    } finally {
        setIsLoading(false);
    }
  };


  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop: handleFileDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false 
  });

  const handleReset = () => {
    setStep('upload');
    setImagePreview(null);
    setPhotoDataUri(null);
    setSurface(null);
    setExtractedMatches(null);
    setResult(null);
    setCounterResult(null);
    setIsLoading(false);
    setIsSaving(false);
    setIsCounterAnalyzing(false);
  }

  const handleCounterAnalysis = async () => {
    if (!result?.consolidatedAnalysis) return;
    setIsCounterAnalyzing(true);
    try {
        const deconstructedData = await deconstructArguments({
            inverapuestasAnalysisText: result.consolidatedAnalysis,
            externalAnalysisText: "Please provide a critical second opinion on this analysis.", // Placeholder for a real external analysis
        });
        const { counterAnalysis: newCounterResult } = await counterAnalysis(deconstructedData);
        setCounterResult(newCounterResult);
    } catch (error) {
        console.error('Error during counter-analysis:', error);
        toast({
            variant: 'destructive',
            title: 'Error en Contra-Análisis',
            description: 'No se pudo obtener la segunda opinión.',
        });
    } finally {
        setIsCounterAnalyzing(false);
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copiado",
        description: "Análisis copiado al portapapeles.",
    });
  }

 const handleSaveAnalysis = async (analysisText: string, picks: Pick[] | undefined, matches: ExtractedMatch[] | null) => {
    if (!analysisText || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para guardar un análisis.' });
        return;
    }
    setIsSaving(true);
    try {
        // Step 1: Create the main analysis document to get its ID
        const analysesCollectionRef = collection(db, 'savedAnalyses');
        const title = matches?.[0]?.participants 
            ? `${matches[0].participants}` + (matches.length > 1 ? ` y ${matches.length - 1} más` : '') 
            : `Análisis del ${new Date().toLocaleDateString()}`;
        
        const newAnalysisData = {
            userId: user.uid,
            title: title,
            createdAt: serverTimestamp(),
            visibility: "private" as const,
            deleted: false,
            metadata: {
                sport: matches?.[0]?.sport || 'Fútbol',
                tournament: matches?.[0]?.tournament || '',
                teams: matches?.[0]?.participants.split(' - ') || []
            },
            currentVersionId: '', // Will be updated
        };
        const analysisDocRef = await addDoc(analysesCollectionRef, newAnalysisData);

        // Step 2: Use the new ID to create the first version in the subcollection
        const versionsCollectionRef = collection(db, 'savedAnalyses', analysisDocRef.id, 'versions');
        const newVersionData = {
            analysisId: analysisDocRef.id,
            author: "ai" as const,
            authorId: 'inverapuestas-pro-model',
            contentMarkdown: analysisText,
            createdAt: serverTimestamp(),
            type: "original" as const,
            deleted: false,
            picks: picks || [],
        };
        const versionDocRef = await addDoc(versionsCollectionRef, newVersionData);
        
        // Step 3: Update the main analysis doc with the ID of the first version
        await updateDoc(analysisDocRef, {
            currentVersionId: versionDocRef.id
        });
        
        toast({
            title: "Análisis Guardado",
            description: "Tu análisis ha sido guardado como un nuevo proyecto.",
            action: (
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/saved-analyses')}>
                Ver Análisis
              </Button>
            ),
        });
    } catch (error) {
        console.error("Failed to save analysis to Firestore:", error);
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: "No se pudo guardar el análisis. Comprueba las reglas de seguridad de Firestore."
        });
    } finally {
      setIsSaving(false);
    }
  };


  const handleShareAnalysis = async (text: string) => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Análisis de Inverapuestas Pro',
                  text: text,
              });
              toast({ title: "Éxito", description: "Análisis compartido."});
          } catch (error) {
              console.error('Error al compartir:', error);
              toast({ variant: 'destructive', title: "Error", description: "No se pudo compartir el análisis."});
          }
      } else {
          // Fallback for browsers that don't support Web Share API
          handleCopyToClipboard(text);
          toast({ title: "Copiado", description: "El análisis se copió al portapapeles para que puedas compartirlo."});
      }
  };


  const ActionButtons = ({ analysisText, picks, isTop = false }: { analysisText: string, picks: Pick[] | undefined, isTop?: boolean }) => (
    <div className={`flex justify-start pt-4 gap-2 flex-wrap ${isTop ? 'pb-4' : ''}`}>
        <Button variant="outline" onClick={handleReset}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Analizar otra Imagen
        </Button>
        <Button variant="outline" onClick={() => handleSaveAnalysis(analysisText, picks, extractedMatches)} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Análisis
        </Button>
        <Button variant="outline" onClick={() => handleCopyToClipboard(analysisText)}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar
        </Button>
        <Button variant="outline" onClick={() => handleShareAnalysis(analysisText)}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir
        </Button>
        {!counterResult && (
            <Button onClick={handleCounterAnalysis} disabled={isCounterAnalyzing} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {isCounterAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                Obtener Segunda Opinión (iaedge)
            </Button>
        )}
    </div>
);


  if (step === 'extracting') {
    return (
        <Card className="flex flex-col items-center justify-center p-8 min-h-[30rem]">
            <div className="flex items-center justify-center gap-4 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-lg font-medium">Extrayendo partidos de la imagen...</p>
            </div>
            {imagePreview && <img src={imagePreview} alt="Preview" className="w-full md:w-1/2 mx-auto rounded-lg opacity-50 mt-8" />}
        </Card>
    )
  }
  
  if (step === 'analyzing') {
    return (
         <Card className="flex flex-col items-center justify-center p-8 min-h-[30rem]">
            <div className="flex items-center justify-center gap-4 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-lg font-medium">Analizando partidos con superficie: {surface}...</p>
            </div>
             <div className="space-y-2 mt-8 w-full text-center">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-24 w-full" />
            </div>
        </Card>
    )
  }

  if (step === 'surface') {
    return (
        <Card>
            <CardContent className="p-8 space-y-6">
                <div className='flex flex-col md:flex-row gap-8 items-center'>
                    {imagePreview && <img src={imagePreview} alt="Preview" className="w-full md:w-1/3 rounded-lg" />}
                    <div className="w-full md:w-2/3 space-y-4">
                        <Alert>
                            <Sparkles className="h-4 w-4" />
                            <AlertTitle>¡Casi listo! Un último paso.</AlertTitle>
                            <AlertDescription>
                               No pudimos determinar la superficie con certeza. Para garantizar la máxima precisión, por favor, selecciónala manualmente.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label htmlFor="surface">Superficie de Juego</Label>
                            <Select name="surface" defaultValue={surface || undefined} onValueChange={(value) => setSurface(value as Surface)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una superficie..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Hard">Pista Dura (Hard)</SelectItem>
                                    <SelectItem value="Clay">Arcilla (Clay)</SelectItem>
                                    <SelectItem value="Grass">Hierba (Grass)</SelectItem>
                                    <SelectItem value="Football">Fútbol (No aplica)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handleReset}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button onClick={() => handleAnalysis(photoDataUri!, surface!, extractedMatches!)} disabled={!surface || isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar y Analizar'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
  }

  if (step === 'result' && result) {
    return (
        <Card>
            <CardContent className="p-8 space-y-6">
                 <Alert variant="default" className="border-green-500 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Análisis Completado por Inverapuestas Pro</AlertTitle>
                    <AlertDescription>
                        Se ha generado tu informe de valor para la superficie: **{surface}**.
                    </AlertDescription>
                </Alert>

                <ActionButtons analysisText={result.consolidatedAnalysis} picks={result.valuePicks} isTop={true} />

                <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4">
                     <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                     >
                        {result.consolidatedAnalysis}
                    </ReactMarkdown>
                </div>
                
                {result.valuePicks && result.valuePicks.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">Tabla de Apuestas de Valor</h3>
                        <ValueBetsTable data={result.valuePicks} />
                    </div>
                )}


                <ActionButtons analysisText={result.consolidatedAnalysis} picks={result.valuePicks} />
                
                {isCounterAnalyzing && (
                     <div className="space-y-6 pt-6">
                        <div className="flex items-center justify-center gap-4 text-primary">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-lg font-medium">"iaedge" está contrastando el análisis...</p>
                        </div>
                        <Skeleton className="h-48 w-full" />
                    </div>
                )}

                {counterResult && (
                    <div className="space-y-6 pt-6 border-t mt-6">
                         <Alert variant="default" className="border-blue-500 bg-blue-500/10">
                            <Bot className="h-4 w-4 text-blue-500" />
                            <AlertTitle>Contra-Análisis por iaedge</AlertTitle>
                            <AlertDescription>
                                Aquí tienes una segunda opinión para un análisis más robusto.
                            </AlertDescription>
                        </Alert>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {counterResult}
                            </ReactMarkdown>
                        </div>
                        <div className="flex justify-start pt-4 gap-2">
                            <Button variant="outline" onClick={() => handleCopyToClipboard(counterResult)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar Contra-Análisis
                            </Button>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    )
  }


  return (
    <div 
        {...getRootProps()} 
        className={`flex flex-col items-center justify-center w-full min-h-[30rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-card ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center p-6">
        <ImageUp className="w-20 h-20 text-muted-foreground mb-4" />
        <p className="mb-2 text-xl font-semibold text-foreground">
          <span className="text-primary">Haz clic para subir</span> o arrastra y suelta tu cupón
        </p>
        <p className="text-lg text-muted-foreground">Sube una captura de pantalla y deja que la IA haga el trabajo pesado</p>
      </div>
    </div>
  );
}
