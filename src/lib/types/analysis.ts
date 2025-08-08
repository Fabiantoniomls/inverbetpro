import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

// Schema for a single match extracted from the image
export const ExtractedMatchSchema = z.object({
    sport: z.enum(['Fútbol', 'Tenis']),
    tournament: z.string().optional().describe('The name of the tournament, if available.'),
    participants: z.string().describe('Names of the teams or players.'),
    market: z.string().describe("The market for the bet (e.g., 'Ganador', 'Resultado del partido')."),
    selection: z.string().describe("The specific outcome selected in the bet slip."),
    odds: z.number().describe("The decimal odds for the specific selection."),
  });
export type ExtractedMatch = z.infer<typeof ExtractedMatchSchema>;
  
  
export const AnalyzeBatchFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a betting slip, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  surface: z.string().optional().describe("The playing surface (e.g., Hard, Clay, Grass). This is a critical factor for analysis accuracy."),
  extractedMatches: z.array(ExtractedMatchSchema).optional().describe("The raw data of matches extracted from the image. Required for the analysis step."),
});
export type AnalyzeBatchFromImageInput = z.infer<typeof AnalyzeBatchFromImageInputSchema>;


export const PickSchema = z.object({
  sport: z.enum(['Fútbol', 'Tenis']),
  match: z.string(),
  market: z.string(),
  selection: z.string(),
  odds: z.number(),
  valueCalculated: z.number().optional().describe("El valor esperado (EV) calculado, como decimal (ej. 0.15 para 15%)."),
  estimatedProbability: z.number().optional().describe("La probabilidad estimada por la IA, en porcentaje (ej. 58.5 para 58.5%)."),
  confidenceScore: z.number().optional().describe("Puntuación de 1 a 10 sobre la confianza de la IA en su propio análisis."),
  keyFactors: z.array(z.string()).optional().describe("Un array de 2-3 factores clave que más influyeron en la decisión."),
});
export type Pick = z.infer<typeof PickSchema>;

export const MainPredictionInsightsSchema = z.object({
    primaryConclusion: z.string().describe("La predicción principal del análisis."),
    confidenceScore: z.number().describe("Un número entero (de 0 a 100) que representa el nivel de confianza en la conclusión principal."),
    keyFactors: z.array(z.string()).describe("Un array de 3 a 5 strings, donde cada string es un factor clave conciso que influyó decisivamente en el análisis."),
    outcomeProbabilities: z.array(z.object({
        outcome: z.string(),
        probability: z.number(),
    })).describe("Un array de objetos que representa la distribución de probabilidad de los posibles resultados."),
});
export type MainPredictionInsights = z.infer<typeof MainPredictionInsightsSchema>;


export const AnalyzeBatchFromImageOutputSchema = z.object({
    consolidatedAnalysis: z.string().describe("A single string containing the full, formatted markdown analysis for all matches."),
    valuePicks: z.array(PickSchema).describe("An array of structured betting picks with positive value, now including XAI fields."),
    extractedMatches: z.array(ExtractedMatchSchema).optional().describe("The raw data of matches extracted from the image."),
    mainPredictionInsights: MainPredictionInsightsSchema.optional().describe("Explainable AI (XAI) insights for the main prediction."),
});
export type AnalyzeBatchFromImageOutput = z.infer<typeof AnalyzeBatchFromImageOutputSchema>;

export const FundamentalAnalysisInputSchema = z.object({
    matchDescription: z.string().describe('Description of the match.'),
    teamAStrengths: z.string().describe('Strengths of team A.'),
    teamAWeaknesses: z.string().describe('Weaknesses of team A.'),
    teamBStrengths: z.string().describe('Strengths of team B.'),
    teamBWeaknesses: z.string().describe('Weaknesses of team B.'),
    keyPlayerTeamA: z.string().describe('Key player of team A.'),
    keyPlayerTeamB: z.string().describe('Key player of team B.'),
    odds: z.number().describe('Odds for the bet.'),
    impliedProbability: z.number().describe('Implied probability of the bet.'),
  });
export type FundamentalAnalysisInput = z.infer<typeof FundamentalAnalysisInputSchema>;
  
export const FundamentalAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Qualitative analysis of the match.'),
  valueTable: z.string().describe('Value table for the bet.'),
});
export type FundamentalAnalysisOutput = z.infer<typeof FundamentalAnalysisOutputSchema>;


// Schema for the structured deconstructed analysis output
export const DeconstructedAnalysisSchema = z.object({
    conclusion: z.string().describe("La predicción o tesis principal del análisis (ej. 'Victoria del Jugador A')."),
    supportingPremises: z.array(z.string()).describe("Una lista de las razones, evidencias o argumentos clave que se presentan para apoyar la conclusión."),
    counterargumentsOrRisks: z.array(z.string()).describe("Una lista de los riesgos, debilidades o contraargumentos mencionados en el análisis."),
});


// Represents the main analysis "project" document
export interface SavedAnalysis {
    id: string;
    userId: string;
    title: string;
    createdAt: Date | Timestamp;
    metadata?: {
        sport: 'Fútbol' | 'Tenis';
        tournament?: string;
        teams?: string[];
        eventDate?: Date;
    };
    currentVersionId?: string;
    deleted?: boolean;
    visibility?: "private" | "public";
}

// Represents a single version document within the 'versions' subcollection
export interface AnalysisVersion {
    id:string;
    analysisId: string;
    author: "user" | "ai" | "external";
    authorId?: string;
    contentMarkdown: string;
    createdAt: Date | Timestamp;
    type: "original" | "interpelacion" | "postmortem" | "edit";
    picks?: Pick[];
    linkedEvents?: Array<{ eventId: string; result?: "win"|"lose"|"push"; finalScore?: string }>;
    aiMeta?: { model: string; promptSnapshot?: string; flowId?: string };
    deleted?: boolean;
    postmortem?: {
        summary: string;
        learnings: string[];
    };
}
