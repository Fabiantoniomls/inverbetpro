'use server';

/**
 * @fileOverview This file defines the Genkit flow for performing fundamental analysis of sports matches.
 *
 * The flow takes qualitative and quantitative data as input, formats it into a prompt,
 * and uses an LLM to generate a qualitative analysis and a value table.
 *
 * @module ai/flows/fundamental-analysis
 *
 * @exports {
 *   fundamentalAnalysis,
 *   FundamentalAnalysisInput,
 *   FundamentalAnalysisOutput,
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FundamentalAnalysisInputSchema = z.object({
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

const FundamentalAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Qualitative analysis of the match.'),
  valueTable: z.string().describe('Value table for the bet.'),
});
export type FundamentalAnalysisOutput = z.infer<typeof FundamentalAnalysisOutputSchema>;

export async function fundamentalAnalysis(input: FundamentalAnalysisInput): Promise<FundamentalAnalysisOutput> {
  return fundamentalAnalysisFlow(input);
}

const fundamentalAnalysisPrompt = ai.definePrompt({
  name: 'fundamentalAnalysisPrompt',
  input: {schema: FundamentalAnalysisInputSchema},
  output: {schema: FundamentalAnalysisOutputSchema},
  prompt: `You are an expert sports analyst specializing in providing qualitative analysis for sports matches and determining the value of potential bets.

You are provided with the following information about the match:

Match Description: {{{matchDescription}}}

Team A Strengths: {{{teamAStrengths}}}
Team A Weaknesses: {{{teamAWeaknesses}}}

Team B Strengths: {{{teamBStrengths}}}
Team B Weaknesses: {{{teamBWeaknesses}}}

Key Player Team A: {{{keyPlayerTeamA}}}
Key Player Team B: {{{keyPlayerTeamB}}}

Odds: {{{odds}}}
Implied Probability: {{{impliedProbability}}}

Based on this information, provide a detailed qualitative analysis of the match and construct a "Table de Apuestas de Valor" to assess the potential value of the bet.  The table should calculate expected value (EV) and provide a recommendation on whether or not to place the bet. Format the value table as a markdown table.

Ensure your output is well-formatted and easy to understand. The analysis should be insightful and the value table should be accurate.
`,
});

const fundamentalAnalysisFlow = ai.defineFlow(
  {
    name: 'fundamentalAnalysisFlow',
    inputSchema: FundamentalAnalysisInputSchema,
    outputSchema: FundamentalAnalysisOutputSchema,
  },
  async input => {
    const {output} = await fundamentalAnalysisPrompt(input);
    return output!;
  }
);
