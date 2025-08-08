'use server';

/**
 * @fileOverview Implements a flow to generate a qualitative summary of user KPIs.
 * 
 * - summarizeKpis - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KpiDataSchema = z.object({
  totalProfitLoss: z.number(),
  roi: z.number(),
  winRate: z.number(),
  currentBankroll: z.number(),
  trend: z.enum(['up', 'down', 'flat']),
});
export type KpiData = z.infer<typeof KpiDataSchema>;

const SummarizeKpisInputSchema = z.object({
    kpiData: KpiDataSchema
});
export type SummarizeKpisInput = z.infer<typeof SummarizeKpisInputSchema>;

const SummarizeKpisOutputSchema = z.object({
    summary: z.string().describe("A brief, analytical, and motivational summary (2-3 sentences)."),
});
export type SummarizeKpisOutput = z.infer<typeof SummarizeKpisOutputSchema>;


export async function summarizeKpis(input: SummarizeKpisInput): Promise<SummarizeKpisOutput> {
  return summarizeKpisFlow(input);
}


const summarizeKpisPrompt = ai.definePrompt({
  name: 'summarizeKpisPrompt',
  input: { schema: SummarizeKpisInputSchema },
  output: { schema: SummarizeKpisOutputSchema },
  prompt: `Eres un analista financiero y coach de inversiones deportivas. Basado en los siguientes Indicadores Clave de Rendimiento (KPIs) del portafolio de un usuario, genera un resumen breve (2-3 frases) que sea a la vez analítico y motivador. En tu respuesta, identifica la métrica más destacada (ya sea positiva o negativa) y ofrece una frase de consejo o ánimo basada en el rendimiento general. La respuesta debe ser directa y en un tono profesional pero accesible.

  KPIs del Usuario:
  {{{kpiData}}}
  `,
    config: {
      temperature: 0.4
    }
});


const summarizeKpisFlow = ai.defineFlow(
  {
    name: 'summarizeKpisFlow',
    inputSchema: SummarizeKpisInputSchema,
    outputSchema: SummarizeKpisOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeKpisPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar el resumen de KPIs.");
    }
    return { summary: output.summary };
  }
);
