'use server';

/**
 * @fileOverview Implements a flow to deconstruct sports analyses into their logical components.
 * 
 * - deconstructArguments - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for the structured analysis output
export const DeconstructedAnalysisSchema = z.object({
    conclusion: z.string().describe("La predicción o tesis principal del análisis (ej. 'Victoria del Jugador A')."),
    supportingPremises: z.array(z.string()).describe("Una lista de las razones, evidencias o argumentos clave que se presentan para apoyar la conclusión."),
    counterargumentsOrRisks: z.array(z.string()).describe("Una lista de los riesgos, debilidades o contraargumentos mencionados en el análisis."),
});
export type DeconstructedAnalysis = z.infer<typeof DeconstructedAnalysisSchema>;


// Input schema for the flow
const DeconstructArgumentsInputSchema = z.object({
    inverapuestasAnalysisText: z.string().describe("El texto del análisis generado por Inverapuestas Pro."),
    externalAnalysisText: z.string().describe("El texto del análisis externo proporcionado por el usuario."),
});
export type DeconstructArgumentsInput = z.infer<typeof DeconstructArgumentsInputSchema>;

// Output schema for the flow
const DeconstructArgumentsOutputSchema = z.object({
    inverapuestasAnalysis: DeconstructedAnalysisSchema,
    externalAnalysis: DeconstructedAnalysisSchema,
});
export type DeconstructArgumentsOutput = z.infer<typeof DeconstructArgumentsOutputSchema>;


export async function deconstructArguments(input: DeconstructArgumentsInput): Promise<DeconstructArgumentsOutput> {
  return deconstructArgumentsFlow(input);
}


const deconstructArgumentsPrompt = ai.definePrompt({
  name: 'deconstructArgumentsPrompt',
  input: { schema: DeconstructArgumentsInputSchema },
  output: { schema: DeconstructArgumentsOutputSchema },
  prompt: `Eres un experto en lógica y análisis argumentativo, especializado en deconstruir razonamientos complejos. Tu tarea es analizar dos textos de análisis de apuestas deportivas y extraer su estructura lógica fundamental. Para cada texto, debes identificar y separar claramente los siguientes componentes:

1.  **conclusion**: La predicción o tesis principal del análisis (ej. "Victoria del Jugador A").
2.  **supportingPremises**: Una lista de las razones, evidencias o argumentos clave que se presentan para apoyar la conclusión.
3.  **counterargumentsOrRisks**: Una lista de los riesgos, debilidades o contraargumentos mencionados en el análisis.

Devuelve tu resultado como un único objeto JSON estructurado con las claves \`inverapuestasAnalysis\` y \`externalAnalysis\`. Cada una de estas claves debe contener un objeto con la estructura \`conclusion\`, \`supportingPremisas\` y \`counterargumentsOrRisks\`.

Textos de Análisis:
\`\`\`json
{
  "inverapuestasAnalysisText": "{{{inverapuestasAnalysisText}}}",
  "externalAnalysisText": "{{{externalAnalysisText}}}"
}
\`\`\`
`,
    config: {
      temperature: 0.1
    }
});


const deconstructArgumentsFlow = ai.defineFlow(
  {
    name: 'deconstructArgumentsFlow',
    inputSchema: DeconstructArgumentsInputSchema,
    outputSchema: DeconstructArgumentsOutputSchema,
  },
  async (input) => {
    const { output } = await deconstructArgumentsPrompt(input);
    if (!output) {
      throw new Error("No se pudo deconstruir los argumentos.");
    }
    return output;
  }
);
