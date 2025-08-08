'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/quantitative-analysis.ts';
import '@/ai/flows/staking-calculator.ts';
import '@/ai/flows/fundamental-analysis.ts';
import '@/ai/flows/analyze-batch-from-image.ts';
import '@/ai/flows/counter-analysis.ts';
import '@/ai/flows/extract-picks.ts';
import '@/ai/flows/summarize-kpis.ts';
import '@/ai/flows/summarize-performance-chart.ts';
import '@/ai/flows/deconstruct-arguments.ts';
import '@/ai/flows/goal-coach.ts';
