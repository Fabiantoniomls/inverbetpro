"use client";
import React from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VersionCard } from "./VersionCard";
import type { AnalysisVersion } from "@/lib/types/analysis";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";

export default function AnalysisTimeline({ analysisId }: { analysisId: string }) {
  const versionsRef = collection(db, 'savedAnalyses', analysisId, 'versions');
  const q = query(versionsRef, orderBy('createdAt','asc'));
  const [snapshot, loading, error] = useCollection(q);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
  
  if (error) return (
    <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al Cargar Versiones</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
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
