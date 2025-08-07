'use server';

/**
 * @fileOverview Implements the batch analysis from image flow.
 *
 * This flow takes an image of a betting slip, extracts match data using a multimodal model,
 * and generates a consolidated, expert-style analysis report for all matches.
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

const consolidatedAnalysisPrompt = ai.definePrompt({
  name: 'consolidatedAnalysisPrompt',
  input: { schema: z.object({ matchesJson: z.string() }) },
  output: { schema: AnalyzeBatchFromImageOutputSchema },
  prompt: `
  Eres "Inverapuestas Pro", un analista deportivo experto de IA, especializado en encontrar apuestas de valor (+EV). Tu estilo es directo, visual y lleno de "insights". Te han proporcionado una lista de partidos de tenis y fútbol en formato JSON. Tu tarea es generar un informe de análisis completo en formato Markdown, en español.

  El informe debe tener la siguiente estructura:

  1.  **Análisis Detallado de Partidos Destacados:**
      *   Para cada partido, presenta un análisis conciso pero potente.
      *   Incluye emojis para hacerlo más visual (ej. 💥, 🚀, 💎 para sorpresas, ✅ para valor, ❌ para no valor).
      *   Menciona datos clave: estado de forma, H2H (si es relevante), estadísticas importantes.
      *   Calcula y muestra la "Probabilidad real" estimada por ti para cada resultado.
      *   Calcula y muestra el "Valor apuesta" (EV = (Probabilidad Real * Cuota) - 1). Marca si hay valor o no.

  2.  **Conclusiones Rápidas Otros Partidos:**
      *   Si hay partidos menos interesantes, menciónalos brevemente aquí.

  3.  **TABLA DE APUESTAS DE VALOR:**
      *   Crea una tabla en Markdown con las columnas: | Partido | Resultado | Cuotas | Prob. Estimada (%) | Valor Calculado |
      *   **Importante:** Incluye en esta tabla ÚNICAMENTE las apuestas con valor positivo (EV > 0).
      *   **Crítico:** Ordena la tabla de MAYOR a MENOR "Valor Calculado".

  4.  **Recomendaciones Finales:**
      *   Ofrece 2-3 recomendaciones clave basadas en el análisis, destacando las mejores oportunidades.
      *   Añade una nota final de estrategia si es necesario.

  Utiliza el siguiente JSON de partidos para generar tu informe:
  {{{matchesJson}}}

  Adopta un tono profesional pero accesible. ¡Sorpréndeme con tu capacidad de análisis!
  `
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
    if (!output?.matches || output.matches.length === 0) {
      throw new Error("No se pudo extraer ningún partido de la imagen.");
    }
    const extractedMatches = output.matches;

    // Step 2: Generate consolidated analysis
    const analysisInput = { matchesJson: JSON.stringify(extractedMatches, null, 2) };
    const analysisResult = await consolidatedAnalysisPrompt(analysisInput);

    if (!analysisResult.output) {
      throw new Error("No se pudo generar el análisis consolidado.");
    }

    return analysisResult.output;
  }
);
