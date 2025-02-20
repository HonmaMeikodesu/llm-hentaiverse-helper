import { PlayerStats } from "../../../battle-parser/types/stats.js";

export function buildBattlePrompt(playerStats: PlayerStats) {
    return `**You encounter a battle**
below is the player stats report:
\`\`\`
${JSON.stringify(playerStats, null, 2)}
\`\`\`
---
Now analyze the overall stats of current player, like how much pyshical and magical damages player can deal, how much defense, how much mitigation to specific types of spell it is against enemies, is current player tend to be warrior or wizard and what is his fight style. After that we can move on.
`}

export function buildBattleEndPrompt(turnover: { result: "victory" | "defeat", detail: any }) {
    return `You gain a ${turnover.result} result in the battle.
`
}
