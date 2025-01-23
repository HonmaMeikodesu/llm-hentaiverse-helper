import { PlayerStats } from "../../../battle-parser/types/stats.js";

const commonBattleInteractionPrompt = `Now Analyze the player stats report as requested in system prompt before we move on.`;

export function buildBattleStartPrompt(playerStats: PlayerStats) {
    return `**You encounter a battle**
below is the player stats report:
\`\`\`
${JSON.stringify(playerStats, null, 2)}
\`\`\`
---
${commonBattleInteractionPrompt}
`}

export function buildBattlePrompt(playerStats: PlayerStats) {
    return `**You are in a battle**
below is the player stats report:
\`\`\`
${JSON.stringify(playerStats, null, 2)}
\`\`\`
---
${commonBattleInteractionPrompt}
`}

export function buildBattleEndPrompt(turnover: { result: "victory" | "defeat", detail: any }) {
    return `You gain a ${turnover.result} result in the battle.
`
}
