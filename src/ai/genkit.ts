import {genkit, FlowRetryError} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({
    // Add a retry handler for API errors.
    requestMiddleware: async (req, next) => {
      let retries = 3;
      while (retries > 0) {
        try {
          return await next(req);
        } catch (e: any) {
          if (e.status === 503 && retries > 0) {
            console.log("Model is overloaded, retrying...");
            retries--;
            await new Promise(r => setTimeout(r, 2000 * (4-retries))); // exponential backoff
          } else {
            throw e;
          }
        }
      }
      throw new Error('Model is overloaded, please try again later.');
    }
  })],
  model: 'googleai/gemini-2.0-flash',
});
