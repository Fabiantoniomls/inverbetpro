# **App Name**: Inverapuestas Pro

## Core Features:

- Fundamental Analysis: Multi-step form for users to input qualitative and quantitative data, formatted into a prompt, and call to an LLM using a Genkit flow to generate qualitative analysis and a value table.
- Quantitative Analysis: User pastes URL, then a Genkit flow extracts data (xG, goals, etc.), processes it with a model (Poisson-xG for football or Elo for tennis), and returns the 'real' probabilities and value table.
- Stake Calculator: After analysis, this feature invokes a Genkit flow that implements staking logic, receives the probability, odds, the user's current bankroll, and their preferred staking method to recommend the amount to stake. This Genkit flow uses a tool to implement Kelly Criterion or similar models.
- Bet Logging: Saves a new document in the bets collection with the status 'Pending.'
- KPI Visualization: Display KPI cards showing overall statistics calculated from the user's bets collection.
- Bet History Table: Displays an interactive table of all user bets with filtering and sorting. Allows marking 'Pending' bets as won or lost, triggering a Genkit flow to update bet status, calculate profit/loss, and update the user's current bankroll in Firestore.
- Historical Performance Chart: Visualizes bankroll growth over time as an area chart, plotted using a sequence of {date, cumulativeProfit} from data that is loaded and processed with a Genkit flow.

## Style Guidelines:

- Primary color: Slate blue (#708090) to convey professionalism and quantitative analysis. 
- Background color: Very dark gray (#282828), suitable for a dark theme but still close to the primary hue.
- Accent color: Light orange (#FFB347) for call-to-action buttons and important information to create a striking contrast against the dark theme.
- Font: 'Inter' (sans-serif) for both body and headlines, providing a modern, neutral, and objective look suitable for data-heavy interfaces. 
- Use 'lucide-react' icon set for a consistent and professional appearance.
- ShadCN/UI components to create a clean and functional dashboard layout. Card-based layout for key metrics, a data table for bet history, and a dedicated chart area.
- Subtle transitions and animations on data updates and interactions to enhance the user experience without being distracting.