import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  initialBankroll: number;
  currentBankroll: number;
  preferredStakingModel: 'Fijo' | 'Porcentual' | 'Kelly Fraccionario';
  createdAt: Timestamp;
}

export interface Bet {
  id: string; // Document ID from Firestore
  userId: string;
  sport: 'Fútbol' | 'Tenis';
  match: string;
  market: string;
  odds: number;
  stake: number;
  status: 'Pendiente' | 'Ganada' | 'Perdida' | 'Nula';
  valueCalculated: number;
  estimatedProbability: number;
  profitOrLoss: number;
  createdAt: Timestamp;
}
