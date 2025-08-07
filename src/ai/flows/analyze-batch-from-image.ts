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
import { z } from 'genkit';
import { 
    ExtractedMatchSchema, 
    AnalyzeBatchFromImageInputSchema, 
    AnalyzeBatchFromImageOutputSchema,
    type AnalyzeBatchFromImageInput,
    type AnalyzeBatchFromImageOutput,
} from '@/lib/types/analysis';

export async function analyzeBatchFromImage(input: AnalyzeBatchFromImageInput): Promise<AnalyzeBatchFromImageOutput> {
  return analyzeBatchFromImageFlow(input);
}


const extractMatchesPrompt = ai.definePrompt({
    name: 'extractMatchesFromImagePrompt',
    input: { schema: AnalyzeBatchFromImageInputSchema },
    output: { schema: z.object({ matches: z.array(ExtractedMatchSchema) }) },
    prompt: `Actúa como un experto en extracción de datos. Analiza meticulosamente la siguiente imagen de una casa de apuestas. Identifica cada partido de fútbol o tenis listado, y si es visible, el nombre del torneo (ej. "Cincinnati Open"). Para cada partido, extrae de forma estructurada los nombres de los participantes y las cuotas decimales para cada resultado principal. Ignora cualquier otra información. Devuelve los datos como un array de objetos JSON.

Ejemplo de Salida JSON Esperada:
[
  {
    "sport": "Tenis",
    "tournament": "Cincinnati Open",
    "participants": "Alcaraz vs Djokovic",
    "odds": { "player1": 1.85, "player2": 2.15 }
  }
]

Photo: {{media url=photoDataUri}}`
});

const consolidatedAnalysisPrompt = ai.definePrompt({
  name: 'consolidatedAnalysisPrompt',
  input: { schema: z.object({ 
    matchesJson: z.string(),
    surface: z.string().describe("The playing surface (Hard, Clay, or Grass). This is a CRITICAL factor."),
  }) },
  output: { schema: AnalyzeBatchFromImageOutputSchema },
  prompt: `
  Eres "Inverapuestas Pro", un analista deportivo de IA de élite, especializado en encontrar apuestas de valor (+EV) en tenis y fútbol. Tu estilo es directo, visual y lleno de "insights". Te han proporcionado una lista de partidos en formato JSON y, de forma crucial, la superficie de juego: **{{{surface}}}**.

  **La superficie es el factor más importante. TODO tu análisis debe girar en torno a cómo rinden los jugadores/equipos EN ESA SUPERFICIE ESPECÍFICA.**

  Tu tarea es generar un informe de análisis completo en formato Markdown, en español. El informe debe tener la siguiente estructura:

  1.  **Análisis Detallado Partidos Destacados:**
      *   Para cada partido, presenta un análisis conciso pero potente, **centrado en la superficie {{{surface}}}**.
      *   Incluye emojis para hacerlo más visual (ej. 💥, 🚀, 💎 para sorpresas, ✅ para valor, ❌ para no valor).
      *   Menciona datos clave **relevantes para la superficie**: % de victorias en la superficie, H2H en la misma superficie, estadísticas importantes (ej. % de puntos ganados al servicio en {{{surface}}}).
      *   Calcula y muestra la "Probabilidad real" estimada por ti para cada resultado, **basada en el rendimiento en {{{surface}}}**.
      *   Calcula y muestra el "Valor apuesta" (EV = (Probabilidad Real * Cuota) - 1). Marca si hay valor o no.

  2.  **Conclusiones Rápidas Otros Partidos:**
      *   Si hay partidos menos interesantes, menciónalos brevemente aquí.

  3.  **TABLA DE APUESTAS DE VALOR:**
      *   Crea una tabla en Markdown con las columnas: | Partido | Resultado | Cuotas | Prob. Estimada (%) | Valor Calculado |
      *   **Importante:** Incluye en esta tabla ÚNICAMENTE las apuestas con valor positivo (EV > 0).
      *   **Crítico:** Ordena la tabla de MAYOR a MENOR "Valor Calculado".

  4.  **Recomendaciones Finales:**
      *   Ofrece 2-3 recomendaciones clave basadas en el análisis, destacando las mejores oportunidades.
      *   Añade una nota final de estrategia si es necesario, siempre recordando la importancia de la superficie.

  Utiliza el siguiente JSON de partidos para generar tu informe:
  {{{matchesJson}}}

  Adopta un tono profesional pero accesible. ¡Demuestra por qué entender la superficie lo es todo!
  `
});


const analyzeBatchFromImageFlow = ai.defineFlow(
  {
    name: 'analyzeBatchFromImageFlow',
    inputSchema: AnalyzeBatchFromImageInputSchema,
    outputSchema: AnalyzeBatchFromImageOutputSchema,
  },
  async (input) => {
    // In this simplified flow, we will extract first and then do analysis in a separate call.
    // A more advanced implementation might stream results.
    
    const { output: extractedData } = await extractMatchesPrompt({ photoDataUri: input.photoDataUri });

    if (!extractedData?.matches || extractedData.matches.length === 0) {
      throw new Error("No se pudo extraer ningún partido de la imagen.");
    }
    
    // The consolidation prompt now receives the surface and does the full analysis.
    const analysisInput = { 
        matchesJson: JSON.stringify(extractedData.matches, null, 2),
        surface: input.surface || 'Unknown' // Pass the surface to the prompt
    };

    const analysisResult = await consolidatedAnalysisPrompt(analysisInput);

    if (!analysisResult.output) {
      throw new Error("No se pudo generar el análisis consolidado.");
    }

    return {
        ...analysisResult.output,
        extractedMatches: extractedData.matches, // Pass extracted matches back to UI
    };
  }
);
