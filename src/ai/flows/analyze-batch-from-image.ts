
'use server';

/**
 * @fileOverview Implements the batch analysis from image flow.
 *
 * This flow takes an image of a betting slip, extracts match data using a multimodal model,
 * allows the user to specify the playing surface, and then generates a consolidated,
 * expert-style analysis report for all matches.
 *
 * - analyzeBatchFromImage - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    ExtractedMatchSchema, 
    AnalyzeBatchFromImageInputSchema, 
    AnalyzeBatchFromImageOutputSchema,
    PickSchema,
    MainPredictionInsightsSchema,
    type AnalyzeBatchFromImageInput,
    type AnalyzeBatchFromImageOutput,
} from '@/lib/types/analysis';

export async function analyzeBatchFromImage(input: AnalyzeBatchFromImageInput): Promise<AnalyzeBatchFromImageOutput> {
  return analyzeBatchFromImageFlow(input);
}


const extractMatchesPrompt = ai.definePrompt({
    name: 'extractMatchesFromImagePrompt',
    input: { schema: z.object({ photoDataUri: z.string() }) },
    output: { schema: z.object({ matches: z.array(ExtractedMatchSchema) }) },
    prompt: `Actúa como un experto en extracción de datos de cupones de apuestas. Analiza meticulosamente la siguiente imagen de un cupón de apuestas combinado. Identifica cada selección de apuesta individual.

Para cada selección, extrae los siguientes datos de forma estructurada:
1.  **sport**: Identifica si es "Fútbol" o "Tenis" basándote en el icono (pelota de fútbol vs pelota de tenis) o los nombres.
2.  **participants**: Los nombres completos de los dos equipos o jugadores que se enfrentan. (Ej: "FC Bayern Munchen - Tottenham Hotspur").
3.  **market**: El mercado al que se apostó. (Ej: "Ganador" o "Resultado del partido").
4.  **selection**: El resultado específico que se seleccionó en el cupón. (Ej: "Joao Fonseca" o "FC Bayern Munchen").
5.  **odds**: La cuota decimal asociada a ESA SELECCIÓN específica.
6.  **tournament**: Si es visible, el nombre del torneo (ej. "Cincinnati Open").

Devuelve los datos como un array de objetos JSON. Ignora cualquier otra información como la cuota total de la combinada, ganancias potenciales, etc.

Photo: {{media url=photoDataUri}}`,
    config: {
      temperature: 0.2
    }
});

const consolidatedAnalysisPrompt = ai.definePrompt({
  name: 'consolidatedAnalysisPrompt',
  input: { schema: z.object({ 
    matchesJson: z.string(),
    surface: z.string().describe("The playing surface (Hard, Clay, or Grass). This is a CRITICAL factor for tennis matches."),
  }) },
  output: { schema: z.object({
      analysisReport: z.string().describe("Un informe de texto detallado (en formato Markdown) que explique tu razonamiento, analizando las fortalezas, debilidades y factores contextuales de cada competidor."),
      valuePicks: z.array(PickSchema).describe("Un array de objetos, donde cada objeto representa una apuesta de valor identificada."),
      mainPredictionInsights: MainPredictionInsightsSchema,
  }) },
  prompt: `Eres un analista experto en inversiones deportivas de clase mundial. Tu tarea es realizar un análisis cuantitativo y cualitativo completo basado en los datos de los partidos proporcionados. Tu salida DEBE ser un único objeto JSON con la siguiente estructura y contenido:

1.  **\`analysisReport\`**: Un informe de texto detallado (en formato Markdown) que explique tu razonamiento, analizando las fortalezas, debilidades y factores contextuales de cada competidor. Incluye una tabla de valor al final del reporte.
2.  **\`valuePicks\`**: Un array de objetos, donde cada objeto representa una apuesta de valor identificada. Para cada pick, rellena TODOS los siguientes campos: \`sport\`, \`match\`, \`market\`, \`selection\`, \`odds\`, \`estimatedProbability\`, \`valueCalculated\`, \`confidenceScore\`, y \`note\`.
3.  **\`mainPredictionInsights\`**: Un objeto que contenga los elementos de IA Explicable para la predicción que consideres MÁS importante o con más confianza de todo el cupón:
    *   **\`primaryConclusion\`**: La predicción principal (ej. "Victoria de Carlos Alcaraz").
    *   **\`confidenceScore\`**: Un número entero (de 0 a 100) que represente tu nivel de confianza en la \`primaryConclusion\`.
    *   **\`keyFactors\`**: Un array de 3 a 5 strings, donde cada string es un factor clave conciso que influyó decisivamente en tu análisis (ej. "Dominio superior de Alcaraz en arcilla", "Reciente estado de forma de Zverev").
    *   **\`outcomeProbabilities\`**: Un array de objetos, cada uno con las claves \`outcome\` y \`probability\` (un número flotante entre 0 y 1), que represente la distribución de probabilidad de los posibles resultados del mercado principal. La suma de las probabilidades debe ser 1.0.

Analiza los siguientes datos y genera la salida JSON completa y estructurada como se ha especificado. Para los partidos de tenis, un factor CRÍTICO es la superficie de juego: **{{{surface}}}**.

Datos de los Partidos:
{{{matchesJson}}}
  `,
    config: {
      temperature: 0.2
    }
});


const analyzeBatchFromImageFlow = ai.defineFlow(
  {
    name: 'analyzeBatchFromImageFlow',
    inputSchema: AnalyzeBatchFromImageInputSchema,
    outputSchema: AnalyzeBatchFromImageOutputSchema,
  },
  async (input) => {
    // If the 'surface' is not provided, it means we are in the extraction step.
    if (!input.surface) {
      const { output: extractedData } = await extractMatchesPrompt({ photoDataUri: input.photoDataUri });
      if (!extractedData?.matches || extractedData.matches.length === 0) {
        throw new Error("No se pudo extraer ningún partido de la imagen.");
      }
      // Return only the extracted matches to the frontend for surface confirmation.
      return {
        extractedMatches: extractedData.matches,
        consolidatedAnalysis: '', // Empty analysis
        valuePicks: [],
      };
    }

    // If 'surface' IS provided, it means the user has confirmed it, and we proceed with analysis.
    // The matches must be passed in the input from the frontend.
    if (!input.extractedMatches) {
        throw new Error("Los datos de los partidos extraídos son necesarios para el análisis.");
    }

    const analysisInput = { 
        matchesJson: JSON.stringify(input.extractedMatches, null, 2),
        surface: input.surface
    };

    const analysisResult = await consolidatedAnalysisPrompt(analysisInput);

    if (!analysisResult.output) {
      throw new Error("No se pudo generar el análisis consolidado.");
    }

    // Return the final analysis, along with the matches for context.
    return {
        consolidatedAnalysis: analysisResult.output.analysisReport,
        valuePicks: analysisResult.output.valuePicks,
        mainPredictionInsights: analysisResult.output.mainPredictionInsights,
        extractedMatches: input.extractedMatches, 
    };
  }
);
