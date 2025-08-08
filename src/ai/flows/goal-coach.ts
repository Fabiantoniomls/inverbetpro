'use server';

/**
 * @fileOverview Implements a flow to generate coaching messages for user financial goals.
 * 
 * - goalCoach - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GoalCoachInputSchema = z.object({
    goalName: z.string().describe("The name of the user's financial goal."),
    targetValue: z.number().describe("The target amount for the goal."),
    currentValue: z.number().describe("The user's current amount towards the goal."),
    progressPercentage: z.number().describe("The user's progress in percentage."),
});
export type GoalCoachInput = z.infer<typeof GoalCoachInputSchema>;

const GoalCoachOutputSchema = z.object({
    coachingMessage: z.string().describe("A personalized coaching message based on the user's progress."),
});
export type GoalCoachOutput = z.infer<typeof GoalCoachOutputSchema>;


export async function goalCoach(input: GoalCoachInput): Promise<GoalCoachOutput> {
  return goalCoachFlow(input);
}


const goalCoachPrompt = ai.definePrompt({
  name: 'goalCoachPrompt',
  input: { schema: GoalCoachInputSchema },
  output: { schema: GoalCoachOutputSchema },
  prompt: `Eres un coach financiero positivo y motivador. Un usuario está trabajando para alcanzar una meta financiera. Basado en los datos de su progreso, genera un mensaje corto (2-3 frases) que reconozca su esfuerzo y le dé un consejo accionable o una palabra de aliento para el siguiente paso. Adapta tu tono según su progreso:

- Si el progreso es > 90%, celebra el logro inminente y anímale para el último esfuerzo.
- Si el progreso está entre 40% y 90%, elogia su consistencia y recuérdale el objetivo.
- Si el progreso es < 40%, anímale por haber comenzado y destaca que cada paso cuenta.

**Datos de la Meta:**
- **Meta:** {{{goalName}}}
- **Progreso:** {{{progressPercentage}}}% (ha alcanzado \${{{currentValue}}} de \${{{targetValue}}})
`,
    config: {
      temperature: 0.5
    }
});


const goalCoachFlow = ai.defineFlow(
  {
    name: 'goalCoachFlow',
    inputSchema: GoalCoachInputSchema,
    outputSchema: GoalCoachOutputSchema,
  },
  async (input) => {
    const { output } = await goalCoachPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar el mensaje de coaching.");
    }
    return output;
  }
);
