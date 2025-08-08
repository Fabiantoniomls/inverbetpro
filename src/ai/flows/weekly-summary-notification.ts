'use server';

/**
 * @fileOverview Implements a flow to generate a weekly performance summary notification.
 * 
 * - weeklySummaryNotification - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WeeklySummaryInputSchema = z.object({
    weeklyProfitLoss: z.number().describe("The user's total profit or loss for the week."),
    weeklyRoi: z.number().describe("The user's return on investment for the week."),
    winningBets: z.number().describe("The number of bets the user won this week."),
    losingBets: z.number().describe("The number of bets the user lost this week."),
});
export type WeeklySummaryInput = z.infer<typeof WeeklySummaryInputSchema>;

const WeeklySummaryOutputSchema = z.object({
   notification: z.object({
        title: z.string().describe("The title for the push notification."),
        body: z.string().describe("The body content for the push notification."),
   })
});
export type WeeklySummaryOutput = z.infer<typeof WeeklySummaryOutputSchema>;


export async function weeklySummaryNotification(input: WeeklySummaryInput): Promise<WeeklySummaryOutput> {
  return weeklySummaryNotificationFlow(input);
}


const weeklySummaryNotificationPrompt = ai.definePrompt({
  name: 'weeklySummaryNotificationPrompt',
  input: { schema: WeeklySummaryInputSchema },
  output: { schema: WeeklySummaryOutputSchema },
  prompt: `Eres un analista de rendimiento. Basado en las métricas de rendimiento de un usuario de la última semana, genera el texto para una notificación push que sea informativa y motivadora. El mensaje debe:

1.  Destacar la métrica más positiva (Ganancia/Pérdida o ROI).
2.  Resumir la actividad (ej. "5 aciertos de 8").
3.  Invitar al usuario a ver el desglose completo en la sección de Métricas.

Métricas Semanales:
{{{jsonStringify this}}}
`,
    config: {
      temperature: 0.5
    }
});


const weeklySummaryNotificationFlow = ai.defineFlow(
  {
    name: 'weeklySummaryNotificationFlow',
    inputSchema: WeeklySummaryInputSchema,
    outputSchema: WeeklySummaryOutputSchema,
  },
  async (input) => {
    const { output } = await weeklySummaryNotificationPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar la notificación de resumen semanal.");
    }
    return output;
  }
);
