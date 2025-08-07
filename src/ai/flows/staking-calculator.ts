'use server';

/**
 * @fileOverview Calculates the optimal stake amount for a bet based on the Kelly Criterion or a fixed percentage method.
 *
 * - stakingCalculator - A function that calculates the stake amount.
 * - StakingCalculatorInput - The input type for the stakingCalculator function.
 * - StakingCalculatorOutput - The return type for the stakingCalculator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StakingCalculatorInputSchema = z.object({
  probability: z
    .number()
    .describe('The estimated probability of winning the bet (0 to 1).'),
  odds: z.number().describe('The decimal odds of the bet.'),
  currentBankroll: z.number().describe('The current bankroll of the user.'),
  preferredStakingModel: z.enum(['Fijo', 'Porcentual', 'Kelly Fraccionario']).describe('The user selected staking model.'),
  kellyFraction: z.number().optional().describe('The fraction of the Kelly Criterion to use. Required when preferredStakingModel is Kelly Fraccionario.'),
  fixedStakeAmount: z.number().optional().describe('The fixed stake amount to use. Required when preferredStakingModel is Fijo.'),
  percentageStakeAmount: z.number().optional().describe('The percentage stake amount to use. Required when preferredStakingModel is Porcentual.'),
});
export type StakingCalculatorInput = z.infer<typeof StakingCalculatorInputSchema>;

const StakingCalculatorOutputSchema = z.object({
  recommendedStake: z.number().describe('The recommended stake amount.'),
});
export type StakingCalculatorOutput = z.infer<typeof StakingCalculatorOutputSchema>;


const calculateStake = ai.defineTool(
  {
    name: 'calculateStake',
    description: 'Calculates the optimal stake amount using the selected staking model.',
    inputSchema: StakingCalculatorInputSchema,
    outputSchema: StakingCalculatorOutputSchema,
  },
  async (input: StakingCalculatorInput) => {
    const { probability, odds, currentBankroll, preferredStakingModel, kellyFraction, fixedStakeAmount, percentageStakeAmount } = input;

    let recommendedStake: number;

    switch (preferredStakingModel) {
      case 'Fijo':
        if (fixedStakeAmount === undefined) {
          throw new Error('Fixed stake amount is required for Fijo staking model.');
        }
        recommendedStake = fixedStakeAmount;
        break;
      case 'Porcentual':
        if (percentageStakeAmount === undefined) {
          throw new Error('Percentage stake amount is required for Porcentual staking model.');
        }
        recommendedStake = currentBankroll * (percentageStakeAmount / 100);
        break;
      case 'Kelly Fraccionario':
        if (kellyFraction === undefined) {
          throw new Error('Kelly fraction is required for Kelly Fraccionario staking model.');
        }

        const edge = probability * odds - (1 - probability);
        const kellyCriterion = edge / (odds - 1);
        recommendedStake = currentBankroll * (kellyFraction * kellyCriterion);
        break;
      default:
        throw new Error('Invalid staking model selected.');
    }

    // Ensure the stake is not negative and not greater than the current bankroll.
    recommendedStake = Math.max(0, Math.min(recommendedStake, currentBankroll));

    return { recommendedStake };
  }
);


const stakingCalculatorPrompt = ai.definePrompt({
  name: 'stakingCalculatorPrompt',
  tools: [calculateStake],
  prompt: `Based on the provided probability, odds, current bankroll, and preferred staking method, calculate the optimal stake amount.

  Probability: {{{probability}}}
  Odds: {{{odds}}}
  Current Bankroll: {{{currentBankroll}}}
  Preferred Staking Model: {{{preferredStakingModel}}}
  Kelly Fraction: {{{kellyFraction}}}
  Fixed Stake Amount: {{{fixedStakeAmount}}}
  Percentage Stake Amount: {{{percentageStakeAmount}}}
  `,
});


const stakingCalculatorFlow = ai.defineFlow(
  {
    name: 'stakingCalculatorFlow',
    inputSchema: StakingCalculatorInputSchema,
    outputSchema: StakingCalculatorOutputSchema,
  },
  async input => {
    const { recommendedStake } = await calculateStake(input);
    return { recommendedStake };
  }
);

/**
 * Calculates the optimal stake amount for a bet based on the Kelly Criterion.
 * @param input - The input parameters for the staking calculation.
 * @returns The recommended stake amount.
 */
export async function stakingCalculator(input: StakingCalculatorInput): Promise<StakingCalculatorOutput> {
  return stakingCalculatorFlow(input);
}

export type { StakingCalculatorInput, StakingCalculatorOutput };

