import { z } from 'zod';

// Schema for a single match extracted from the image
export const ExtractedMatchSchema = z.object({
    sport: z.enum(['Fútbol', 'Tenis']),
    participants: z.string().describe('Names of the teams or players.'),
    odds: z.object({
      local: z.number().optional().describe('Odds for home team win.'),
      draw: z.number().optional().describe('Odds for a draw.'),
      visitor: z.number().optional().describe('Odds for away team win.'),
      player1: z.number().optional().describe('Odds for player 1 to win.'),
      player2: z.number().optional().describe('Odds for player 2 to win.'),
    }),
  });
export type ExtractedMatch = z.infer<typeof ExtractedMatchSchema>;
  
  
export const AnalyzeBatchFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a betting slip, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type AnalyzeBatchFromImageInput = z.infer<typeof AnalyzeBatchFromImageInputSchema>;


export const AnalyzeBatchFromImageOutputSchema = z.object({
    detailedAnalyses: z.array(z.object({
        match: z.string(),
        analysis: z.string(),
    })).describe("An array of detailed analyses for each match."),
    summaryValueTable: z.string().describe("A single markdown table summarizing all value bets found, ordered by value.")
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