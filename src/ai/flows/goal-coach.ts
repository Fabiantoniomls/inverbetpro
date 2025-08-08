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
  prompt: `Eres un coach financiero y de mentalidad, especializado en motivar a inversores. Tu tono es de apoyo, pero también analítico y directo al grano. Analiza el progreso del usuario hacia su meta y genera un mensaje de coaching personalizado (máximo 3 frases) que interprete su situación y le ofrezca un consejo accionable o una reflexión.

**Contexto del Usuario:**
- **Meta:** {{{goalName}}}
- **Progreso:** {{{progressPercentage}}}% (ha alcanzado \${{{currentValue}}} de \${{{targetValue}}})

**Tu Tarea:**
1.  **Diagnostica el Progreso:** ¿Está cerca? ¿A mitad de camino? ¿Acaba de empezar? ¿Está estancado?
2.  **Genera un Mensaje Relevante:**
    *   Si está cerca (>80%), elógialo y enfócalo en el último esfuerzo.
    *   Si está a mitad de camino (40-80%), reconoce el esfuerzo y anímalo a mantener la consistencia.
    *   Si está empezando (<40%), refuerza la importancia del primer paso y la visión a largo plazo.
    *   Adapta el mensaje para que sea específico y útil.
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
