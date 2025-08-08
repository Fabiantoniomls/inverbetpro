'use server';

/**
 * @fileOverview Implements a flow to generate a message when a user unlocks a badge.
 * 
 * - badgeUnlocked - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BadgeUnlockedInputSchema = z.object({
    badgeName: z.string().describe("The name of the badge the user has unlocked."),
    badgeDescription: z.string().describe("A description of the action the user took to earn the badge."),
});
export type BadgeUnlockedInput = z.infer<typeof BadgeUnlockedInputSchema>;

const BadgeUnlockedOutputSchema = z.object({
    title: z.string().describe("A celebratory title for the notification or modal (e.g., '¡Logro Desbloqueado!')."),
    body: z.string().describe("A message of 2-3 sentences that congratulates the user, reinforces the habit, and encourages them to continue."),
});
export type BadgeUnlockedOutput = z.infer<typeof BadgeUnlockedOutputSchema>;


export async function badgeUnlocked(input: BadgeUnlockedInput): Promise<BadgeUnlockedOutput> {
  return badgeUnlockedFlow(input);
}


const badgeUnlockedPrompt = ai.definePrompt({
  name: 'badgeUnlockedPrompt',
  input: { schema: BadgeUnlockedInputSchema },
  output: { schema: BadgeUnlockedOutputSchema },
  prompt: `Eres el sistema de recompensas de la aplicación de inversión Inverapuestas Pro. Un usuario acaba de desbloquear un logro. Basado en el nombre y la descripción del logro, genera un mensaje de felicitación para una notificación o un modal. El mensaje debe tener:

1.  Un título de celebración (ej. "¡Logro Desbloqueado!").
2.  Un cuerpo de 2-3 frases que felicite al usuario, refuerce la importancia del hábito que representa esa insignia y le anime a continuar.

Usa un tono positivo y de empoderamiento.

Detalles del Logro:
- **Nombre de la Insignia:** {{{badgeName}}}
- **Descripción:** {{{badgeDescription}}}
`,
    config: {
      temperature: 0.4
    }
});


const badgeUnlockedFlow = ai.defineFlow(
  {
    name: 'badgeUnlockedFlow',
    inputSchema: BadgeUnlockedInputSchema,
    outputSchema: BadgeUnlockedOutputSchema,
  },
  async (input) => {
    const { output } = await badgeUnlockedPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar el mensaje de la insignia.");
    }
    return output;
  }
);
