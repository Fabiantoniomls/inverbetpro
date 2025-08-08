
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
1.  **Sport**: Identifica si es "Fútbol" o "Tenis" basándote en el icono (pelota de fútbol vs pelota de tenis) o los nombres.
2.  **Participants**: Los nombres completos de los dos equipos o jugadores que se enfrentan. (Ej: "FC Bayern Munchen - Tottenham Hotspur").
3.  **Market**: El mercado al que se apostó. (Ej: "Ganador" o "Resultado del partido").
4.  **Selection**: El resultado específico que se seleccionó en el cupón. (Ej: "Joao Fonseca" o "FC Bayern Munchen").
5.  **Odds**: La cuota decimal asociada a ESA SELECCIÓN específica.
6.  **Tournament**: Si es visible, el nombre del torneo (ej. "Cincinnati Open").

Devuelve los datos como un array de objetos JSON. Ignora cualquier otra información como la cuota total de la combinada, ganancias potenciales, etc.

Ejemplo de Salida JSON Esperada:
[
  {
    "sport": "Tenis",
    "participants": "Joao Fonseca - Bu Yunchaokete",
    "market": "Ganador",
    "selection": "Joao Fonseca",
    "odds": 1.42
  },
  {
    "sport": "Fútbol",
    "participants": "FC Bayern Munchen - Tottenham Hotspur",
    "market": "Resultado del partido",
    "selection": "FC Bayern Munchen",
    "odds": 1.50
  }
]

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
      report: z.string().describe("The full analysis report in Markdown, excluding the value bets table."),
      valuePicks: z.array(PickSchema).describe("An array of structured betting picks ONLY for those with positive value (EV > 0).")
  }) },
  prompt: `
  Eres "Inverapuestas Pro", un analista deportivo de IA de élite, especializado en encontrar apuestas de valor (+EV) en tenis y fútbol. Tu estilo es directo, visual y lleno de "insights". Te han proporcionado una lista de selecciones de un cupón de apuestas en formato JSON. Para los partidos de tenis, un factor CRÍTICO es la superficie de juego: **{{{surface}}}**.

  **Tu análisis de tenis DEBE girar en torno a cómo rinden los jugadores EN ESA SUPERFICIE ESPECÍFICA.** Para el fútbol, la superficie no es relevante.

  Tu tarea es generar un informe de análisis y una lista estructurada de apuestas de valor.

  **PARTE 1: INFORME DE ANÁLISIS (Formato Markdown)**
  Genera un informe en español con la siguiente estructura. **IMPORTANTE: NO incluyas la tabla de valor en este informe de texto.**
  1.  **Análisis Detallado de Selecciones:**
      *   Para cada selección del cupón, presenta un análisis conciso pero potente.
      *   **Para Tenis:** Céntrate en el rendimiento en la superficie **{{{surface}}}**. Incluye datos clave como % de victorias en la superficie, H2H en la misma superficie, y estadísticas relevantes (ej. % de puntos ganados al servicio en {{{surface}}}).
      *   **Para Fútbol:** Analiza la forma actual, H2H, tácticas y noticias relevantes (lesiones, etc.).
      *   Incluye emojis para hacerlo más visual (ej. 💥, 🚀, 💎 para sorpresas, ✅ para valor, ❌ para no valor).
      *   Calcula y muestra la "Probabilidad real" estimada por ti para el resultado SELECCIONADO.
      *   Calcula y muestra el "Valor apuesta" (EV = (Probabilidad Real * Cuota) - 1). Marca si la selección tiene valor o no.

  2.  **Conclusiones Rápidas (Opcional):**
      *   Si hay selecciones que son muy claras o no requieren mucho detalle, coméntalas brevemente aquí.

  3.  **Recomendaciones Finales:**
      *   Ofrece 2-3 recomendaciones clave basadas en tu análisis, destacando las mejores oportunidades encontradas en el cupón.
      *   Añade una nota final de estrategia si es necesario (ej. "Aunque hay valor en X, es una apuesta de alto riesgo").


  **PARTE 2: APUESTAS DE VALOR (Formato JSON)**
  Crea un array de objetos JSON para las apuestas de valor.
  *   **Importante:** Incluye en este array ÚNICAMENTE las selecciones con valor positivo (EV > 0).
  *   Para cada pick, extrae los siguientes campos: 'sport', 'match', 'market', 'selection', 'odds', 'estimatedProbability', 'valueCalculated'.
  *   'estimatedProbability' debe ser un número (ej. 58.5 para 58.5%).
  *   'valueCalculated' debe ser un número (ej. 0.15 para 15%).
  *   'match' debe ser el campo 'participants' del JSON de entrada.

  Utiliza el siguiente JSON de selecciones para generar tu informe y tu lista JSON:
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
        consolidatedAnalysis: analysisResult.output.report,
        valuePicks: analysisResult.output.valuePicks,
        extractedMatches: input.extractedMatches, 
    };
  }
);
