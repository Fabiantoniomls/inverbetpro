
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
    MatchAnalysisSchema,
    type AnalyzeBatchFromImageInput,
    type AnalyzeBatchFromImageOutput,
} from '@/lib/types/analysis';
import { getPlayerStats, getTeamStats } from '@/services/historical-data-service';

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
    historicalData: z.string().describe("Relevant historical data for the participants involved."),
  }) },
  output: { schema: z.object({
      analysisReport: z.string().describe("Un informe de texto detallado (en formato Markdown) que explique tu razonamiento, siguiendo la estructura jerárquica estandarizada."),
      matchAnalyses: z.array(MatchAnalysisSchema).describe("Un array de objetos, donde cada objeto representa un partido. Para CADA partido, DEBES rellenar los datos de AMBOS participantes (participantA y participantB), incluyendo nombre, cuota, probabilidad estimada, y valor calculado."),
      mainPredictionInsights: MainPredictionInsightsSchema.optional().describe("Explainable AI (XAI) insights for the main prediction."),
  }) },
  prompt: `Eres un analista experto en inversiones deportivas de clase mundial. Tu tarea es realizar un análisis cuantitativo y cualitativo completo basado en los datos de los partidos proporcionados y generar un objeto JSON.

**Fuente de Datos Primaria:**
Utiliza los siguientes datos históricos como la fuente principal y más fiable para tu análisis. Basa tus conclusiones en estas estadísticas.
\`\`\`json
{{{historicalData}}}
\`\`\`

**Análisis Requerido:**
Para cada partido, realiza lo siguiente:
1.  Estima la **probabilidad real** (en porcentaje, ej. 55.5) de que cada participante gane, basándote en los datos históricos proporcionados.
2.  Calcula el **valor esperado (EV)** para la apuesta de cada participante usando la fórmula: \`EV = (Probabilidad Real / 100) * Cuota - 1\`. El resultado debe ser un decimal (ej. 0.15 para un 15% de valor).
3.  Escribe un análisis cualitativo breve para cada partido, haciendo referencia a los datos históricos.

**Formato de Salida Requerido:**
Genera un objeto JSON que contenga:
1.  **\`analysisReport\`**: Un informe de texto en formato Markdown que siga ESTRICTAMENTE la siguiente estructura jerárquiana:
    *   Un título principal para el deporte (ej. \`## 🎾 Tenis\`).
    *   Para CADA partido, crea una lista numerada (ej. \`1. Carlos Alcaraz vs Jiri Lehecka\`).
    *   Dentro de cada partido, anida una lista con viñetas que contenga:
        *   **Análisis**: Un subtítulo \`o Análisis:\` seguido de viñetas anidadas con tus puntos clave basados en los datos históricos.
        *   **Veredicto**: Una viñeta con tu recomendación final para esa apuesta.
    *   **NO incluyas la Tabla de Valor en este informe de texto.**

2.  **\`matchAnalyses\`**: Un array de objetos. Para CADA partido, rellena un objeto con los siguientes campos: \`matchTitle\`, \`market\`, \`sport\`, y un objeto para \`participantA\` y otro para \`participantB\`. Cada participante debe incluir: \`name\`, \`odds\`, \`estimatedProbability\`, y \`valueCalculated\`. **Es CRÍTICO que proporciones los datos para AMBOS participantes en cada partido.**

3.  **\`mainPredictionInsights\`**: (Opcional) Un objeto con los elementos de IA Explicable para la predicción que consideres MÁS importante de todo el cupón.

Analiza los siguientes datos y genera la salida JSON completa y estructurada como se ha especificado. Para los partidos de tenis, un factor CRÍTICO es la superficie de juego: **{{{surface}}}**.

Datos de los Partidos del Cupón:
\`\`\`json
{{{matchesJson}}}
\`\`\`
  `,
    config: {
      temperature: 0.4
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
        matchAnalyses: [],
      };
    }

    // If 'surface' IS provided, it means the user has confirmed it, and we proceed with analysis.
    if (!input.extractedMatches) {
        throw new Error("Los datos de los partidos extraídos son necesarios para el análisis.");
    }
    
    // Fetch historical data for all participants
    const historicalData: Record<string, any> = {};
    for (const match of input.extractedMatches) {
        const participants = match.participants.split(' - ').map(p => p.trim());
        for (const participantName of participants) {
            if (historicalData[participantName]) continue; // Avoid duplicate lookups
            let stats = null;
            if (match.sport === 'Tenis') {
                stats = await getPlayerStats(participantName);
            } else if (match.sport === 'Fútbol') {
                stats = await getTeamStats(participantName);
            }
            if (stats) {
                historicalData[participantName] = stats;
            }
        }
    }


    const analysisInput = { 
        matchesJson: JSON.stringify(input.extractedMatches, null, 2),
        surface: input.surface,
        historicalData: JSON.stringify(historicalData, null, 2)
    };

    const analysisResult = await consolidatedAnalysisPrompt(analysisInput);

    if (!analysisResult.output) {
      throw new Error("No se pudo generar el análisis consolidado.");
    }

    // Return the final analysis, along with the matches for context.
    return {
        consolidatedAnalysis: analysisResult.output.analysisReport,
        matchAnalyses: analysisResult.output.matchAnalyses,
        mainPredictionInsights: analysisResult.output.mainPredictionInsights,
        extractedMatches: input.extractedMatches, 
    };
  }
);
