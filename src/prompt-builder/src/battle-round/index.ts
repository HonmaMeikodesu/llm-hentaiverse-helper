import { MonsterStats } from "../../../battle-parser/types/stats.js";

export function buildRoundPrompt(monstersStats: MonsterStats[]) {
    return `**You encounter a round**
monsters are spawned, Below is the current monsters stats report:
\`\`\`
${JSON.stringify(monstersStats, null, 2)}
\`\`\`
Note that the \`attack\` field is the type of attack the monster can deal. Other fields like \`piercing\`, \`slashing\`, \`fire\`, \`holy\` and so on indicates the mitigation level of the monster against specific type of attack. With higher number means more mitigation, with lower number means this type of attack could be its weak point.
Note that monsters stats report might be empty or missing some monsters' stats because of insufficient information.
**If you receive an empty monsters stats report, then skip the Analyze process, just output \`Recevied Empty Monsters Stats Report\` as response and do no more reasoning jobs**


Now analyze the overall stats of all monsters in this round, like what type of attack each monster deals, what type of attack could be its weak point and mitigation. After that we can move on.
`
}

export function buildRoundEndPrompt(hasNextRound: boolean) {
    return `All monsters of current round have been neutralized, good job!
${hasNextRound ? "Prepare yourself for next round and new enemies!" : "No more rounds are left!"}
`
}
