import { MonsterStats } from "../../../battle-parser/types/stats.js";

export function buildRoundStartPrompt(monstersStats: MonsterStats[]) {
    return `**A new round is starting**
New monsters spawned, heads up! Below is the new monsters stats report:
${JSON.stringify(monstersStats, null, 2)}
---
Now Analyze the monsters stats report as requested in system prompt before we move on.
`
}

export function buildRoundPrompt(monstersStats: MonsterStats[]) {
    return `**You are in a round**
Monsters stats report of current round is as follows:
---
Now Analyze the monsters stats report as requested in system prompt before we move on.
${JSON.stringify(monstersStats, null, 2)}
`
}

export function buildRoundEndPrompt(hasNextRound: boolean) {
    return `All monsters of current round have been neutralized, good job!
${hasNextRound ? "Prepare yourself for next round and new enemies!" : "No more rounds are left!"}
`
}