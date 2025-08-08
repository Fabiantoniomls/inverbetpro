import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  initialBankroll: number;
  currentBankroll: number;
  preferredStakingModel: 'Fijo' | 'Porcentual' | 'Kelly Fraccionario';
  createdAt: Date;
}

export interface Bet {
  id: string; // Will be a unique ID, e.g., Firestore document ID
  userId: string;
  sport: 'Fútbol' | 'Tenis';
  match: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  status: 'Pendiente' | 'Ganada' | 'Perdida' | 'Nula';
  valueCalculated: number;
  estimatedProbability: number;
  profitOrLoss: number;
  createdAt: Date;
  source?: {
    analysisId: string;
    versionId: string;
  };
}

// Represents the main analysis "project" document
export interface SavedAnalysis {
    id: string;
    userId: string;
    title: string;
    createdAt: Date;
    // Optional metadata for the event
    metadata?: {
        sport: 'Fútbol' | 'Tenis';
        tournament?: string;
        teams?: string[];
        eventDate?: Date;
    };
    currentVersionId?: string; // Points to the latest or most relevant version
    deleted?: boolean;
    visibility?: "private" | "public";
}

// Represents a single version document within the 'versions' subcollection
export interface AnalysisVersion {
    id: string; // Firestore document ID
    analysisId: string; // Back-reference to the parent SavedAnalysis doc
    author: "user" | "ai" | "external";
    authorId?: string; // Optional: user ID if author is 'user'
    contentMarkdown: string;
    createdAt: Date;
    type: "original" | "interpelacion" | "postmortem" | "edit";
    // Optional fields based on vision
    picks?: any[]; 
    linkedEvents?: any[];
    aiMeta?: any;
    deleted?: boolean;
    postmortem?: {
        summary: string;
        learnings: string[];
    };
}
