import { PlayerStats } from "../../../battle-parser/types/stats.js";

export function buildBattleStartPrompt(playerStats: PlayerStats) {
    return `**You encouter a battle**
below is the player stats report:
${JSON.stringify(playerStats, null, 2)}
`}

export function buildBattleEndPrompt(turnover: { result: "victory" | "defeat", detail: any }) {
    return `You gain a ${turnover.result} result in the battle.
`
}
