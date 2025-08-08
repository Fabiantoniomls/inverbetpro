'use server';

/**
 * @fileOverview Implements a flow to extract structured betting picks from a markdown analysis.
 * 
 * - extractPicks - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PickSchema } from '@/lib/types/analysis';

const ExtractPicksInputSchema = z.object({
    analysisContent: z.string().describe("The markdown content of the sports analysis."),
});
export type ExtractPicksInput = z.infer<typeof ExtractPicksInputSchema>;

const ExtractPicksOutputSchema = z.object({
    picks: z.array(PickSchema).describe("An array of structured betting picks."),
});
export type ExtractPicksOutput = z.infer<typeof ExtractPicksOutputSchema>;


export async function extractPicks(input: ExtractPicksInput): Promise<ExtractPicksOutput> {
  return extractPicksFlow(input);
}


const extractPicksPrompt = ai.definePrompt({
  name: 'extractPicksPrompt',
  input: { schema: ExtractPicksInputSchema },
  output: { schema: ExtractPicksOutputSchema },
  prompt: `
  Eres un experto analista cuantitativo de apuestas. Tu tarea es leer el siguiente análisis deportivo y extraer CUALQUIER apuesta o "pick" sugerido de forma explícita o implícita en el texto. Presta especial atención a las "Tablas de Valor".

  Analiza el siguiente texto:
  """
  {{{analysisContent}}}
  """

  Extrae una lista de picks sugeridos en formato JSON, siguiendo estrictamente el esquema proporcionado. El esquema requiere los siguientes campos para cada pick:
  - **sport**: 'Fútbol' o 'Tenis'.
  - **match**: El nombre completo del partido (ej. "Real Madrid vs FC Barcelona").
  - **market**: El mercado de la apuesta (ej. "Ganador", "Resultado del partido", "Más de 2.5 Goles").
  - **selection**: La selección específica (ej. "Real Madrid", "Joao Fonseca").
  - **odds**: La cuota decimal.
  - **valueCalculated**: El valor o "edge" calculado, expresado como un decimal (ej. 0.15 para un 15%). Si no se especifica, calcúlalo si tienes la probabilidad real.
  - **estimatedProbability**: La probabilidad estimada de que la selección gane, expresada en porcentaje (ej. 58.5 para 58.5%).
  
  Si un campo no se puede determinar a partir del texto, omítelo. Devuelve un array vacío si no encuentras ningún pick.
  `,
    config: {
      temperature: 0.1
    }
});


const extractPicksFlow = ai.defineFlow(
  {
    name: 'extractPicksFlow',
    inputSchema: ExtractPicksInputSchema,
    outputSchema: ExtractPicksOutputSchema,
  },
  async (input) => {
    const { output } = await extractPicksPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar la extracción de picks.");
    }
    return { picks: output.picks };
  }
);
