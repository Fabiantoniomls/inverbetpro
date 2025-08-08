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
    congratulatoryMessage: z.string().describe("A personalized message that congratulates the user and explains the value of their achievement."),
});
export type BadgeUnlockedOutput = z.infer<typeof BadgeUnlockedOutputSchema>;


export async function badgeUnlocked(input: BadgeUnlockedInput): Promise<BadgeUnlockedOutput> {
  return badgeUnlockedFlow(input);
}


const badgeUnlockedPrompt = ai.definePrompt({
  name: 'badgeUnlockedPrompt',
  input: { schema: BadgeUnlockedInputSchema },
  output: { schema: BadgeUnlockedOutputSchema },
  prompt: `Eres un mentor y coach de inversiones deportivas. Un usuario acaba de desbloquear un logro ("insignia") en la aplicación. Tu tarea es generar un mensaje de felicitación (2-3 frases) que no solo celebre el logro, sino que también refuerce positivamente el hábito subyacente, explicando su importancia para el éxito a largo plazo como inversor.

**Detalles de la Insignia Desbloqueada:**
- **Nombre de la Insignia:** {{{badgeName}}}
- **Razón del Logro:** {{{badgeDescription}}}

Genera ahora el mensaje de felicitación y refuerzo.
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
