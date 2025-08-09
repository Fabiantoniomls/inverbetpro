
'use server';

/**
 * @fileOverview Implements a research assistant flow that can answer user questions
 * by looking up data in the local historical database.
 * 
 * - researchAssistant - The main function for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getTeamStats } from '@/services/historical-data-service';

const ResearchAssistantInputSchema = z.object({
    question: z.string().describe("The user's question about a team or player."),
});
export type ResearchAssistantInput = z.infer<typeof ResearchAssistantInputSchema>;

const ResearchAssistantOutputSchema = z.object({
    answer: z.string().describe("A comprehensive answer to the user's question, based on the retrieved data. Should be in Markdown format."),
});
export type ResearchAssistantOutput = z.infer<typeof ResearchAssistantOutputSchema>;


export async function researchAssistant(input: ResearchAssistantInput): Promise<ResearchAssistantOutput> {
  return researchAssistantFlow(input);
}

// Define the tool for the AI to use
const teamStatsTool = ai.defineTool(
    {
        name: 'getTeamStats',
        description: 'Get historical and statistical data for a specific football team. Use this to answer questions about a team\'s performance, stats, or form.',
        inputSchema: z.object({ teamName: z.string() }),
        outputSchema: z.any(), // Using any for now, can be tightened later
    },
    async ({ teamName }) => {
        return await getTeamStats(teamName);
    }
);


const researchAssistantPrompt = ai.definePrompt({
    name: 'researchAssistantPrompt',
    input: { schema: ResearchAssistantInputSchema },
    output: { schema: ResearchAssistantOutputSchema },
    tools: [teamStatsTool],
    prompt: `You are a sports data research assistant. Your goal is to answer the user's question by using the available tools to look up historical data.

- If you find data, present it clearly to the user in a markdown format. Synthesize the data into a brief, insightful summary.
- If you cannot find data for the requested team or player, clearly state that you don't have information on them.
- Do not invent or hallucinate data. Only use the information provided by the tools.

User's Question:
{{{question}}}
`,
    config: {
      temperature: 0.1
    }
});


const researchAssistantFlow = ai.defineFlow(
  {
    name: 'researchAssistantFlow',
    inputSchema: ResearchAssistantInputSchema,
    outputSchema: ResearchAssistantOutputSchema,
  },
  async (input) => {
    const llmResponse = await researchAssistantPrompt(input);
    const toolCalls = llmResponse.toolCalls();

    // If there are no tool calls, it means the model is answering directly.
    if (!toolCalls || toolCalls.length === 0) {
        const textResponse = llmResponse.text();
        return { answer: textResponse || "No pude procesar la solicitud." };
    }

    // Right now, we only handle one tool call for simplicity.
    const call = toolCalls[0];
    const toolResult = await call.run();
    
    // Now call the model AGAIN, but this time with the result of the tool call.
    const finalResponse = await researchAssistantPrompt({
      ...input,
      // @ts-ignore - Adding history is a valid (but less documented) way to provide tool output
      history: [
          llmResponse.request.messages[0], // Original user question
          llmResponse.message, // The LLM's tool request
          { role: 'tool', content: [{
              tool: { name: call.name, input: call.input },
              output: toolResult
          }]}
      ]
    });
    
    return { answer: finalResponse.output()?.answer || "No se pudo generar una respuesta final." };
  }
);
