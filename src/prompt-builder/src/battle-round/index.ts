import { MonsterStats } from "../../../battle-parser/types/stats.js";

const commonInteractionPrompt = `
Now Analyze the monsters stats report as requested in system prompt before we move on.
Note that you might receive an empty or incomplete monsters stats report due to lack of information.
**If you receive an empty monsters stats report, then skip the Analyze process, just output \`Recevied Empty Monsters Stats Report\` as response and do no more reasoning jobs**
`

export function buildRoundStartPrompt(monstersStats: MonsterStats[]) {
    return `**A new round is starting**
New monsters spawned, heads up! Below is the new monsters stats report:
\`\`\`
${JSON.stringify(monstersStats, null, 2)}
\`\`\`
---
${commonInteractionPrompt}
`
}

export function buildRoundPrompt(monstersStats: MonsterStats[]) {
    return `**You are in a round**
Monsters stats report of current round is as follows:
\`\`\`
${JSON.stringify(monstersStats, null, 2)}
\`\`\`
---
${commonInteractionPrompt}
`
}

export function buildRoundEndPrompt(hasNextRound: boolean) {
    return `All monsters of current round have been neutralized, good job!
${hasNextRound ? "Prepare yourself for next round and new enemies!" : "No more rounds are left!"}
`
}