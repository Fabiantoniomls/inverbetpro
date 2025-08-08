"use client";
import React from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VersionCard } from "./VersionCard";
import type { AnalysisVersion } from "@/lib/types/analysis";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";

export default function AnalysisTimeline({ analysisId }: { analysisId: string }) {
  const versionsRef = collection(db, 'savedAnalyses', analysisId, 'versions');
  // Simplificamos la consulta para evitar posibles problemas de índices compuestos que pueden causar errores de permisos si no existen.
  // El orden se puede manejar en el cliente.
  const q = query(versionsRef, where('deleted', '!=', true));
  const [snapshot, loading, error] = useCollection(q);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
  
  if (error) {
    const isPermissionError = (error as any).code === 'permission-denied';
    return (
        <Alert variant="destructive">
            {isPermissionError ? <ShieldAlert className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{isPermissionError ? 'Error de Permisos de Firestore' : 'Error al Cargar Versiones'}</AlertTitle>
            <AlertDescription>
              {isPermissionError 
                ? "La aplicación no tiene permiso para leer las versiones del análisis. Esto casi siempre se debe a un error en las reglas de seguridad de Firestore. Por favor, ve a la consola de Firebase y asegúrate de que tus reglas para la subcolección 'versions' permitan la lectura (allow read) si el 'userId' del documento padre coincide con el del usuario autenticado."
                : error.message
              }
            </AlertDescription>
        </Alert>
    );
  }

  if (snapshot?.empty) return (
    <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sin Versiones</AlertTitle>
        <AlertDescription>Este proyecto de análisis no tiene versiones visibles.</AlertDescription>
    </Alert>
  );

  // Ordenamos en el cliente para evitar la necesidad de un índice compuesto en Firestore.
  const versions = snapshot?.docs
    .map(d => ({ id: d.id, ...d.data() } as AnalysisVersion))
    .sort((a, b) => (a.createdAt as any)?.seconds - (b.createdAt as any)?.seconds);

  return (
    <div className="space-y-4">
      {versions?.map((v) => (
        <VersionCard key={v.id} version={v} analysisId={analysisId} />
      ))}
    </div>
  );
}
