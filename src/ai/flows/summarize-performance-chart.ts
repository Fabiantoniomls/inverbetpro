'use server';

/**
 * @fileOverview Implements a flow to generate a qualitative summary of a user's performance chart data.
 * 
 * - summarizePerformanceChart - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChartDataPointSchema = z.object({
  date: z.string(),
  cumulativeProfit: z.number(),
});

const SummarizePerformanceChartInputSchema = z.object({
    performanceData: z.array(ChartDataPointSchema)
});
export type SummarizePerformanceChartInput = z.infer<typeof SummarizePerformanceChartInputSchema>;

const SummarizePerformanceChartOutputSchema = z.object({
    summary: z.string().describe("A one-paragraph summary (max 4 sentences) of the performance trend."),
});
export type SummarizePerformanceChartOutput = z.infer<typeof SummarizePerformanceChartOutputSchema>;


export async function summarizePerformanceChart(input: SummarizePerformanceChartInput): Promise<SummarizePerformanceChartOutput> {
  return summarizePerformanceChartFlow(input);
}


const summarizePerformanceChartPrompt = ai.definePrompt({
  name: 'summarizePerformanceChartPrompt',
  input: { schema: SummarizePerformanceChartInputSchema },
  output: { schema: SummarizePerformanceChartOutputSchema },
  prompt: `Eres un analista de datos especializado en tendencias de rendimiento financiero. A continuación se presenta una serie de puntos de datos que representan la ganancia/pérdida acumulada de un usuario a lo largo del tiempo. Analiza la trayectoria y genera un resumen de un párrafo (máximo 4 frases) que describa la tendencia general. Identifica cualquier período notable de crecimiento, declive o volatilidad. Tu análisis debe ser objetivo y basado puramente en los datos proporcionados.

  Datos de Rendimiento:
  {{{performanceData}}}
  `,
    config: {
      temperature: 0.3
    }
});


const summarizePerformanceChartFlow = ai.defineFlow(
  {
    name: 'summarizePerformanceChartFlow',
    inputSchema: SummarizePerformanceChartInputSchema,
    outputSchema: SummarizePerformanceChartOutputSchema,
  },
  async (input) => {
    // Prevent calling the model with too few data points.
    if (input.performanceData.length < 3) {
      return { summary: "No hay suficientes datos para un análisis de tendencia significativo." };
    }

    const { output } = await summarizePerformanceChartPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar el resumen del gráfico de rendimiento.");
    }
    return { summary: output.summary };
  }
);
