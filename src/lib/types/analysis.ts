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


export const AnalyzeBatchFromImageOutputSchema = z.object({
    consolidatedAnalysis: z.string().describe("A single string containing the full, formatted markdown analysis for all matches."),
    extractedMatches: z.array(ExtractedMatchSchema).optional().describe("The raw data of matches extracted from the image."),
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


export const PickSchema = z.object({
  sport: z.enum(['Fútbol', 'Tenis']),
  match: z.string(),
  market: z.string(),
  selection: z.string(),
  odds: z.number(),
  valueCalculated: z.number().optional(),
  estimatedProbability: z.number().optional(),
  stakeSuggestion: z.number().optional(),
  confidenceScore: z.number().optional(),
  note: z.string().optional(),
});
export type Pick = z.infer<typeof PickSchema>;

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
    versions?: AnalysisVersion[];
}

// Represents a single version document within the 'versions' subcollection
export interface AnalysisVersion {
    id: string;
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
