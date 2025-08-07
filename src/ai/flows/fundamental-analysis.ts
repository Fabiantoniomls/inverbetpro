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
import { FundamentalAnalysisInputSchema, FundamentalAnalysisOutputSchema, type FundamentalAnalysisInput, type FundamentalAnalysisOutput } from '@/lib/types/analysis';

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
