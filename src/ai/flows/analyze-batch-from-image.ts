'use server';

/**
 * @fileOverview Implements the batch analysis from image flow.
 *
 * This flow takes an image of a betting slip, extracts match data using a multimodal model,
 * runs fundamental analysis on each match, and returns a consolidated result.
 *
 * - analyzeBatchFromImage - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fundamentalAnalysis } from './fundamental-analysis';
import { 
    ExtractedMatchSchema, 
    AnalyzeBatchFromImageInputSchema, 
    AnalyzeBatchFromImageOutputSchema,
    type AnalyzeBatchFromImageInput,
    type AnalyzeBatchFromImageOutput,
    type FundamentalAnalysisInput,
} from '@/lib/types/analysis';


export async function analyzeBatchFromImage(input: AnalyzeBatchFromImageInput): Promise<AnalyzeBatchFromImageOutput> {
  return analyzeBatchFromImageFlow(input);
}


const extractMatchesPrompt = ai.definePrompt({
    name: 'extractMatchesFromImagePrompt',
    input: { schema: AnalyzeBatchFromImageInputSchema },
    output: { schema: z.object({ matches: z.array(ExtractedMatchSchema) }) },
    prompt: `Actúa como un experto en extracción de datos. Analiza meticulosamente la siguiente imagen de una casa de apuestas. Identifica cada partido de fútbol o tenis listado. Para cada partido, extrae de forma estructurada los nombres de los participantes y las cuotas decimales para cada resultado principal (ej. Victoria Local, Empate, Victoria Visitante para fútbol; o Victoria Jugador 1, Victoria Jugador 2 para tenis). Ignora cualquier otra información. Devuelve los datos como un array de objetos JSON.

Ejemplo de Salida JSON Esperada:
[
  {
    "sport": "Fútbol",
    "participants": "Real Madrid vs FC Barcelona",
    "odds": { "local": 2.20, "draw": 3.50, "visitor": 3.10 }
  },
  {
    "sport": "Tenis",
    "participants": "Alcaraz vs Djokovic",
    "odds": { "player1": 1.85, "player2": 2.15 }
  }
]

Photo: {{media url=photoDataUri}}`
});


const analyzeBatchFromImageFlow = ai.defineFlow(
  {
    name: 'analyzeBatchFromImageFlow',
    inputSchema: AnalyzeBatchFromImageInputSchema,
    outputSchema: AnalyzeBatchFromImageOutputSchema,
  },
  async (input) => {
    // Step 1: Extract data from image
    const { output } = await extractMatchesPrompt(input);
    if (!output?.matches) {
      throw new Error("Could not extract any matches from the image.");
    }
    const extractedMatches = output.matches;

    // Step 2: Iterative Analysis
    const analysisPromises = extractedMatches.map(async (match) => {
      // Find the most likely bet (highest probability implied by lowest odds)
      const oddsValues = Object.values(match.odds).filter(v => v !== undefined) as number[];
      const minOdd = Math.min(...oddsValues);
      const impliedProbability = (1 / minOdd) * 100;

      const analysisInput: FundamentalAnalysisInput = {
        matchDescription: match.participants,
        teamAStrengths: 'Fortalezas no especificadas en imagen.',
        teamAWeaknesses: 'Debilidades no especificadas en imagen.',
        teamBStrengths: 'Fortalezas no especificadas en imagen.',
        teamBWeaknesses: 'Debilidades no especificadas en imagen.',
        keyPlayerTeamA: 'No especificado',
        keyPlayerTeamB: 'No especificado',
        odds: minOdd,
        impliedProbability: impliedProbability,
      };

      const result = await fundamentalAnalysis(analysisInput);
      
      // Parse the markdown table to find the value
      const valueRow = result.valueTable.split('\n').find(row => row.includes('**Apostar**'));
      let valueCalculated = -1; // Default to no value
      if (valueRow) {
          const cells = valueRow.split('|').map(c => c.trim());
          const evCell = cells[4];
          if(evCell) {
            const evMatch = evCell.match(/[+-]?\d+(\.\d+)?/);
            if (evMatch) {
              valueCalculated = parseFloat(evMatch[0]);
            }
          }
      }

      return {
        match: match.participants,
        analysis: result.analysis,
        valueTableData: {
          match: match.participants,
          outcome: valueRow ? valueRow.split('|')[1].trim() : 'N/A',
          odds: minOdd.toFixed(2),
          estimatedProbability: valueRow ? valueRow.split('|')[2].trim() : 'N/A',
          valueCalculated: valueCalculated,
        }
      };
    });

    const individualResults = await Promise.all(analysisPromises);

    // Step 3: Consolidate results
    const detailedAnalyses = individualResults.map(({ match, analysis }) => ({ match, analysis }));
    
    const valueBets = individualResults
      .map(r => r.valueTableData)
      .filter(v => v.valueCalculated > 0)
      .sort((a, b) => b.valueCalculated - a.valueCalculated);

    let summaryValueTable = `| Partido | Resultado | Cuotas | Su Probabilidad Estimada (%) | Valor Calculado |\n|---|---|---|---|---|\n`;
    if (valueBets.length > 0) {
      valueBets.forEach(bet => {
        summaryValueTable += `| ${bet.match} | ${bet.outcome} | ${bet.odds} | ${bet.estimatedProbability} | ${bet.valueCalculated.toFixed(3)} |\n`;
      });
    } else {
        summaryValueTable += `| No se encontraron apuestas de valor en la imagen. | - | - | - | - |\n`;
    }

    return {
      detailedAnalyses,
      summaryValueTable,
    };
  }
);