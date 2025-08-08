"use client";
import React from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VersionCard } from "./VersionCard";
import type { AnalysisVersion } from "@/lib/types/analysis";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";

export default function AnalysisTimeline({ analysisId }: { analysisId: string }) {
  const versionsRef = collection(db, 'savedAnalyses', analysisId, 'versions');
  // Query to get all versions that are not soft-deleted, ordered by creation date
  const q = query(versionsRef, where('deleted', '!=', true), orderBy('deleted', 'asc'), orderBy('createdAt','asc'));
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
            <AlertTitle>{isPermissionError ? 'Error de Permisos' : 'Error al Cargar Versiones'}</AlertTitle>
            <AlertDescription>
              {isPermissionError 
                ? "No se pudieron cargar las versiones de este análisis. Revisa las reglas de seguridad de tu base de datos Firestore para asegurar que se permite la lectura de la subcolección 'versions'."
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

  const versions = snapshot?.docs.map(d => ({ id: d.id, ...d.data() } as AnalysisVersion));

  return (
    <div className="space-y-4">
      {versions?.map((v) => (
        <VersionCard key={v.id} version={v} analysisId={analysisId} />
      ))}
    </div>
  );
}
