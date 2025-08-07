export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  initialBankroll: number;
  currentBankroll: number;
  preferredStakingModel: 'Fijo' | 'Porcentual' | 'Kelly Fraccionario';
  createdAt: Date;
}

export interface Bet {
  id: string; // Will be a unique ID, e.g., timestamp + match
  userId: string;
  sport: 'Fútbol' | 'Tenis';
  match: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  status: 'Pendiente' | 'Ganada' | 'Perdida' | 'Nula';
  valueCalculated: number;
  estimatedProbability: number;
  profitOrLoss: number;
  createdAt: Date;
}
