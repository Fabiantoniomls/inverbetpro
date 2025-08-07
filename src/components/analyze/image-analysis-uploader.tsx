"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, ArrowLeft, CheckCircle, ImageUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzeBatchFromImage } from '@/ai/flows/analyze-batch-from-image';
import type { AnalyzeBatchFromImageOutput } from '@/lib/types/analysis';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '../ui/card';

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

export function ImageAnalysisUploader() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeBatchFromImageOutput | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async (file: File) => {
    setIsLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const photoDataUri = reader.result as string;
        try {
            const analysisResult = await analyzeBatchFromImage({ photoDataUri });
            setResult(analysisResult);
        } catch (error) {
            console.error('Error during image analysis:', error);
            toast({
                variant: 'destructive',
                title: 'Error en el Análisis',
                description: 'No se pudo procesar la imagen. Por favor, inténtalo de nuevo.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast({
            variant: 'destructive',
            title: 'Error de Archivo',
            description: 'No se pudo leer el archivo de imagen.',
        });
        setIsLoading(false);
    };
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      handleAnalysis(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false 
  });

  const handleReset = () => {
    setImagePreview(null);
    setResult(null);
    setIsLoading(false);
  }

  if (isLoading) {
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

  if (result) {
    return (
        <CardContent className="space-y-6">
             <Alert variant="default" className="border-green-500 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Análisis Completado</AlertTitle>
                <AlertDescription>
                    Se ha generado tu informe de valor. ¡Revisa las mejores oportunidades!
                </AlertDescription>
            </Alert>
            <div className="prose prose-sm dark:prose-invert max-w-none">
                 <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        table: MarkdownTable,
                        thead: MarkdownTHead,
                        tr: MarkdownTr,
                        th: MarkdownTh,
                        td: MarkdownTd,
                    }}
                 >
                    {result.consolidatedAnalysis}
                </ReactMarkdown>
            </div>
            <div className="flex justify-start pt-4">
                <Button variant="outline" onClick={handleReset}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Analizar otra Imagen
                </Button>
            </div>
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
