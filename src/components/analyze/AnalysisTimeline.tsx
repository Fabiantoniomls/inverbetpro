"use client";
import React from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VersionCard } from "./VersionCard";
import type { AnalysisVersion } from "@/lib/types/analysis";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";

export default function AnalysisTimeline({ analysisId }: { analysisId: string }) {
  const versionsRef = collection(db, 'savedAnalyses', analysisId, 'versions');
  // Consulta simple para obtener versiones. El filtrado y orden se manejarán en el cliente
  // para cumplir con las reglas de seguridad de Firestore que no pueden hacer lookups de documentos padres.
  const q = query(versionsRef, orderBy("createdAt", "asc"));
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

  // Filtramos y ordenamos las versiones en el lado del cliente.
  const versions = snapshot?.docs
    .map(d => ({ id: d.id, ...d.data() } as AnalysisVersion))
    .filter(v => !v.deleted) // Filtrar las eliminadas en el cliente
    .sort((a, b) => {
        const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(0);
        const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(0);
        return dateA.getTime() - dateB.getTime();
    });
    
  if (versions.length === 0) {
     return (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sin Versiones Visibles</AlertTitle>
            <AlertDescription>Este proyecto de análisis no tiene versiones visibles.</AlertDescription>
        </Alert>
      );
  }


  return (
    <div className="space-y-4">
      {versions?.map((v) => (
        <VersionCard key={v.id} version={v} analysisId={analysisId} />
      ))}
    </div>
  );
}
