"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, ArrowLeft, CheckCircle, Copy, ImageUp, Loader2, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzeBatchFromImage } from '@/ai/flows/analyze-batch-from-image';
import { counterAnalysis } from '@/ai/flows/counter-analysis';
import type { AnalyzeBatchFromImageOutput, ExtractedMatch } from '@/lib/types/analysis';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

// Custom renderer for tables to add ShadCN styling
function MarkdownTable({ children }: { children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-lg border my-4">
            <table className="min-w-full divide-y divide-border">{children}</table>
        </div>
    );
}

function MarkdownTHead({ children }: { children: React.ReactNode }) {
    return <thead className="bg-muted/50">{children}</thead>;
}

function MarkdownTr({ children }: { children: React.ReactNode }) {
    return <tr className="hover:bg-muted/50">{children}</tr>;
}

function MarkdownTh({ children }: { children: React.ReactNode }) {
    return <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{children}</th>;
}

function MarkdownTd({ children }: { children: React.ReactNode }) {
    return <td className="px-4 py-3 whitespace-nowrap text-sm">{children}</td>;
}

const markdownComponents = {
    table: MarkdownTable,
    thead: MarkdownTHead,
    tr: MarkdownTr,
    th: MarkdownTh,
    td: MarkdownTd,
};

type AnalysisStep = 'upload' | 'surface' | 'loading' | 'result';
type Surface = 'Hard' | 'Clay' | 'Grass' | 'Football';


export function ImageAnalysisUploader() {
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [surface, setSurface] = useState<Surface | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCounterAnalyzing, setIsCounterAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeBatchFromImageOutput | null>(null);
  const [counterResult, setCounterResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setPhotoDataUri(reader.result as string);
        setStep('surface');
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast({
            variant: 'destructive',
            title: 'Error de Archivo',
            description: 'No se pudo leer el archivo de imagen.',
        });
        handleReset();
      };
    }
  }, [toast]);

  const handleAnalysis = async () => {
    if (!photoDataUri || !surface) {
        toast({ variant: 'destructive', title: 'Faltan datos', description: 'Por favor, proporciona una imagen y selecciona una superficie.' });
        return;
    }
    
    setStep('loading');
    setIsLoading(true);
    setResult(null);
    setCounterResult(null);

    try {
        const analysisResult = await analyzeBatchFromImage({ photoDataUri, surface });
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
    setResult(null);
    setCounterResult(null);
    setIsLoading(false);
    setIsCounterAnalyzing(false);
  }

  const handleCounterAnalysis = async () => {
    if (!result?.consolidatedAnalysis) return;
    setIsCounterAnalyzing(true);
    try {
        const { counterAnalysis: newCounterResult } = await counterAnalysis({ originalAnalysis: result.consolidatedAnalysis });
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


  if (step === 'loading' || isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-lg font-medium">Analizando partidos en la imagen...</p>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-24 w-full" />
            </div>
            <h3 className="text-lg font-semibold pt-4">Tabla de Valor Resumida</h3>
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

  if (step === 'surface') {
    return (
        <CardContent className="space-y-6">
            <div className='flex flex-col md:flex-row gap-6 items-center'>
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-full md:w-1/3 rounded-lg" />}
                <div className="w-full md:w-2/3 space-y-4">
                    <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle>¡Casi listo! Un último paso.</AlertTitle>
                        <AlertDescription>
                           Para garantizar la máxima precisión, selecciona la superficie en la que se juegan los partidos. Este factor es **crítico** para el análisis.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label htmlFor="surface">Superficie de Juego</Label>
                        <Select name="surface" onValueChange={(value) => setSurface(value as Surface)}>
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
                <Button onClick={handleAnalysis} disabled={!surface || isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar y Analizar'}
                </Button>
            </div>
        </CardContent>
    )
  }

  if (step === 'result' && result) {
    return (
        <CardContent className="space-y-6">
             <Alert variant="default" className="border-green-500 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Análisis Completado por Inverapuestas Pro</AlertTitle>
                <AlertDescription>
                    Se ha generado tu informe de valor para la superficie: **{surface}**.
                </AlertDescription>
            </Alert>
            <div className="prose prose-sm dark:prose-invert max-w-none">
                 <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                 >
                    {result.consolidatedAnalysis}
                </ReactMarkdown>
            </div>

            <div className="flex justify-start pt-4 gap-2 flex-wrap">
                <Button variant="outline" onClick={handleReset}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Analizar otra Imagen
                </Button>
                <Button variant="outline" onClick={() => handleCopyToClipboard(result.consolidatedAnalysis)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Análisis
                </Button>
                {!counterResult && (
                    <Button onClick={handleCounterAnalysis} disabled={isCounterAnalyzing} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        {isCounterAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Obtener Segunda Opinión (iaedge)
                    </Button>
                )}
            </div>

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
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
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
    )
  }


  return (
    <div 
        {...getRootProps()} 
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center">
        <ImageUp className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="mb-2 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta una imagen
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPG</p>
      </div>
    </div>
  );
}
