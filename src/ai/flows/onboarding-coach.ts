'use server';

/**
 * @fileOverview Implements a flow to generate a personalized onboarding message.
 * 
 * - onboardingCoach - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OnboardingInputSchema = z.object({
    experienceLevel: z.string().describe("The user's self-reported experience level (e.g., 'Principiante', 'Intermedio')."),
    favoriteSports: z.array(z.string()).describe("A list of the user's favorite sports."),
    primaryGoal: z.string().describe("The user's main objective for using the app."),
});
export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;

const OnboardingOutputSchema = z.object({
    title: z.string().describe("A welcoming title."),
    body: z.string().describe("A 3-4 sentence message that acknowledges the user's profile and validates their goal."),
    suggestedAction: z.object({
        text: z.string().describe("A clear, actionable call-to-action text for a button or link."),
        link: z.string().describe("A relative URL for the suggested action (e.g., '/dashboard/analyze')."),
    }),
});
export type OnboardingOutput = z.infer<typeof OnboardingOutputSchema>;


export async function onboardingCoach(input: OnboardingInput): Promise<OnboardingOutput> {
  return onboardingCoachFlow(input);
}


const onboardingCoachPrompt = ai.definePrompt({
  name: 'onboardingCoachPrompt',
  input: { schema: OnboardingInputSchema },
  output: { schema: OnboardingOutputSchema },
  prompt: `Eres un asistente de bienvenida y coach de inversiones para la aplicación Inverapuestas Pro. Tu misión es crear una primera impresión personalizada y motivadora para un nuevo usuario. Basado en sus respuestas al cuestionario inicial, genera una respuesta JSON que contenga:

1.  **title**: Un título de bienvenida cálido (ej. "¡Bienvenido a Inverapuestas Pro!").
2.  **body**: Un mensaje de 3-4 frases que reconozca su nivel de experiencia e intereses, valide su objetivo principal y establezca una expectativa positiva.
3.  **suggestedAction**: Un objeto con un \`text\` y un \`link\` para sugerir un primer paso claro y accionable que le ayude a empezar a alcanzar su objetivo. Por ejemplo, si su objetivo es aprender, sugiérele analizar una apuesta; si es crecer capital, sugiérele explorar el historial.

El tono debe ser acogedor, profesional y empoderador.

**Respuestas del Usuario:**
- Nivel de Experiencia: {{{experienceLevel}}}
- Deportes Favoritos: {{{favoriteSports}}}
- Objetivo Principal: {{{primaryGoal}}}
`,
    config: {
      temperature: 0.4
    }
});


const onboardingCoachFlow = ai.defineFlow(
  {
    name: 'onboardingCoachFlow',
    inputSchema: OnboardingInputSchema,
    outputSchema: OnboardingOutputSchema,
  },
  async (input) => {
    const { output } = await onboardingCoachPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar el mensaje de bienvenida.");
    }
    return output;
  }
);
