'use server';

/**
 * @fileOverview Implements a flow to generate a reminder notification for an inactive analysis.
 * 
 * - inactiveAnalysisReminder - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InactiveAnalysisReminderInputSchema = z.object({
    analysisTitle: z.string().describe("The title of the saved analysis."),
    savedDate: z.string().describe("The date when the analysis was saved."),
    daysSinceSaved: z.number().describe("The number of days that have passed since the analysis was saved."),
});
export type InactiveAnalysisReminderInput = z.infer<typeof InactiveAnalysisReminderInputSchema>;

const InactiveAnalysisReminderOutputSchema = z.object({
   notification: z.object({
        title: z.string().describe("The title for the push notification."),
        body: z.string().describe("The body content for the push notification."),
   })
});
export type InactiveAnalysisReminderOutput = z.infer<typeof InactiveAnalysisReminderOutputSchema>;


export async function inactiveAnalysisReminder(input: InactiveAnalysisReminderInput): Promise<InactiveAnalysisReminderOutput> {
  return inactiveAnalysisReminderFlow(input);
}


const inactiveAnalysisReminderPrompt = ai.definePrompt({
  name: 'inactiveAnalysisReminderPrompt',
  input: { schema: InactiveAnalysisReminderInputSchema },
  output: { schema: InactiveAnalysisReminderOutputSchema },
  prompt: `Eres un asistente proactivo de la aplicación Inverapuestas Pro. Un usuario guardó un análisis hace varios días pero no ha tomado ninguna acción. Genera el texto para una notificación push que sea un recordatorio amable y útil. El mensaje debe:

1.  Mencionar el análisis específico para dar contexto.
2.  Hacer una pregunta abierta para impulsar la acción (ej. "¿Quieres revisarlo o registrarlo en tu historial?").
3.  Ser breve y no generar presión.

Genera una respuesta JSON con un título para la notificación y un cuerpo.

Detalles del Análisis:
- Título: {{{analysisTitle}}}
- Días desde que se guardó: {{{daysSinceSaved}}}
`,
    config: {
      temperature: 0.5
    }
});


const inactiveAnalysisReminderFlow = ai.defineFlow(
  {
    name: 'inactiveAnalysisReminderFlow',
    inputSchema: InactiveAnalysisReminderInputSchema,
    outputSchema: InactiveAnalysisReminderOutputSchema,
  },
  async (input) => {
    const { output } = await inactiveAnalysisReminderPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar el recordatorio de análisis inactivo.");
    }
    return output;
  }
);
