'use server';

/**
 * @fileOverview Implements a flow to generate a message for a user's activity streak.
 * 
 * - streakMessage - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StreakInputSchema = z.object({
    streakType: z.string().describe("The type of streak the user has maintained (e.g., 'Análisis Diario')."),
    streakLength: z.number().describe("The duration of the streak in days."),
});
export type StreakInput = z.infer<typeof StreakInputSchema>;

const StreakOutputSchema = z.object({
    message: z.string().describe("A short, energetic celebratory message."),
});
export type StreakOutput = z.infer<typeof StreakOutputSchema>;


export async function streakMessage(input: StreakInput): Promise<StreakOutput> {
  return streakMessageFlow(input);
}


const streakMessagePrompt = ai.definePrompt({
  name: 'streakMessagePrompt',
  input: { schema: StreakInputSchema },
  output: { schema: StreakOutputSchema },
  prompt: `Eres un coach de hábitos. Un usuario de una app de inversión ha mantenido una racha de actividad. Basado en el tipo de racha y su duración en días, genera un mensaje de felicitación corto y enérgico (máximo 2 frases) que celebre su consistencia. Menciona explícitamente el número de días para enfatizar el logro.

Datos de la Racha:
- **Tipo:** {{{streakType}}}
- **Duración:** {{{streakLength}}} días
`,
    config: {
      temperature: 0.5
    }
});


const streakMessageFlow = ai.defineFlow(
  {
    name: 'streakMessageFlow',
    inputSchema: StreakInputSchema,
    outputSchema: StreakOutputSchema,
  },
  async (input) => {
    const { output } = await streakMessagePrompt(input);
    if (!output) {
      throw new Error("No se pudo generar el mensaje de racha.");
    }
    return output;
  }
);
