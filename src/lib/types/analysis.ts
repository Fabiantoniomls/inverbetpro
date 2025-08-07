import { z } from 'zod';

// Schema for a single match extracted from the image
export const ExtractedMatchSchema = z.object({
    sport: z.enum(['Fútbol', 'Tenis']),
    tournament: z.string().optional().describe('The name of the tournament, if available.'),
    participants: z.string().describe('Names of the teams or players.'),
    odds: z.object({
      local: z.number().optional().describe('Decimal odds for local team win (for Football).'),
      draw: z.number().optional().describe('Decimal odds for a draw (for Football).'),
      visitor: z.number().optional().describe('Decimal odds for visitor team win (for Football).'),
      player1: z.number().optional().describe('Decimal odds for player 1 win (for Tennis).'),
      player2: z.number().optional().describe('Decimal odds for player 2 win (for Tennis).'),
    }).describe('An object with the decimal odds for each possible outcome.'),
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
