
'use server';

import footballData from '@/data/football.json';
import tennisData from '@/data/tennis.json';

// Define the types for our data to ensure type safety
interface TeamStats {
    team: string;
    xG_home: number;
    xG_away: number;
    recentForm: string[];
    goalsFor: number;
    goalsAgainst: number;
    homeAdvantage: number;
}

interface PlayerStats {
    player: string;
    surfaceStats: {
        [surface: string]: { matches: number; wins: number; losses: number; };
    };
    tieBreakRecord: { played: number; won: number; lost: number; };
    recentForm: string[];
}

/**
 * Finds the historical statistics for a given football team.
 * @param teamName The name of the team to search for.
 * @returns The statistics for the team, or null if not found.
 */
export async function getTeamStats(teamName: string): Promise<TeamStats | null> {
    console.log(`Searching for team: ${teamName}`);
    const team = (footballData as TeamStats[]).find(t => t.team.toLowerCase() === teamName.toLowerCase());
    return team || null;
}

/**
 * Finds the historical statistics for a given tennis player.
 * @param playerName The name of the player to search for.
 * @returns The statistics for the player, or null if not found.
 */
export async function getPlayerStats(playerName: string): Promise<PlayerStats | null> {
    console.log(`Searching for player: ${playerName}`);
    const player = (tennisData as PlayerStats[]).find(p => p.player.toLowerCase() === playerName.toLowerCase());
    return player || null;
}
