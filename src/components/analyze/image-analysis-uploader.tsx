"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, ArrowLeft, CheckCircle, ImageUp, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { analyzeBatchFromImage } from '@/ai/flows/analyze-batch-from-image';
import type { AnalyzeBatchFromImageOutput } from '@/lib/types/analysis';
import { useToast } from '@/hooks/use-toast';

function MarkdownTable({ markdown }: { markdown: string }) {
    if (!markdown) return null;
    const rows = markdown.trim().split('\n').map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));
    if (rows.length < 2) return <p>{markdown}</p>;

    const header = rows[0];
    const body = rows.slice(2);

    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full">
                <thead className="bg-muted/50">
                    <tr>
                        {header.map((h, i) => <th key={i} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {body.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/50">
                            {row.map((cell, j) => <td key={j} className="px-4 py-3 whitespace-nowrap text-sm">{cell.replace(/\*\*/g, '')}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
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
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <h3 className="text-lg font-semibold pt-4">Tabla de Valor Resumida</h3>
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

  if (result) {
    return (
        <div className="space-y-6">
            <Alert variant="default" className="border-green-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Análisis Completado</AlertTitle>
                <AlertDescription>
                    Se han analizado {result.detailedAnalyses.length} partidos. Revisa los detalles a continuación.
                </AlertDescription>
            </Alert>

            <h3 className="text-lg font-semibold">Análisis Detallados</h3>
            <Accordion type="single" collapsible className="w-full">
                {result.detailedAnalyses.map((item, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{item.match}</AccordionTrigger>
                        <AccordionContent>
                           {item.analysis}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            
            <h3 className="text-lg font-semibold">Tabla de Valor Resumida</h3>
            <MarkdownTable markdown={result.summaryValueTable} />

            <div className="flex justify-start pt-4">
                <Button variant="outline" onClick={handleReset}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Analizar otra Imagen
                </Button>
            </div>
        </div>
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
        <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 800x400px)</p>
      </div>
    </div>
  );
}
