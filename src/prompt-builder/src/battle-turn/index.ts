import { BattleSigRep } from "../../../battle-parser/src/index.js";
import { BattleAction, FightStyle } from "../../../battle-parser/types/common.js";
import { RestorativeSlotItem } from "../../../battle-parser/types/item.js";
import { InnateSkill, OneHandedWeaponSkill } from "../../../battle-parser/types/skill.js";
import { FireSpell, SupportiveSpell } from "../../../battle-parser/types/spell.js";
import { LLMBattleAttackAction, LLMBattleDefendAction, LLMBattleFocusAction, LLMBattleItemsAction, LLMBattleSkillAction, LLMBattleSpellAction, LLMBattleSpiritAction } from "../../../command-io/types/index.js";

const attackDemo: LLMBattleAttackAction = {
    action: BattleAction.ATTACK,
    target: "Alpha-gravis 011"
};

const itemsDemo: LLMBattleItemsAction = {
    action: BattleAction.ITEMS,
    itemName: RestorativeSlotItem.HealthDraught,
};

const spiritDemo: LLMBattleSpiritAction = {
    action: BattleAction.SPIRIT,
    enable: true,
};

const defendDemo: LLMBattleDefendAction = {
    action: BattleAction.DEFEND,
};

const focustDemo: LLMBattleFocusAction = {
    action: BattleAction.FOCUS,
};

const skillDemo: LLMBattleSkillAction = {
    action: BattleAction.SKILL,
    skillName: OneHandedWeaponSkill.ShieldBash,
    target: "Beta-gravis 00a",
};

const spellDemo: LLMBattleSpellAction = {
    action: BattleAction.SPELL,
    spellName: FireSpell.FieryBlast,
    target: "Alpha-gravis 011",
};

const spellDemo1: LLMBattleSpellAction = {
    action: BattleAction.SPELL,
    spellName: SupportiveSpell.Protection,
    target: "_player_",
};

export function buildTurnRespondFormatPrompt() {
    return `Output your action in fixated JSON format as follows.

For ${BattleAction.ATTACK} action, respond in following format:
\`\`\`
${JSON.stringify(attackDemo, null, 2)}
\`\`\`
---

For ${BattleAction.DEFEND} action, respond in following format:
\`\`\`
${JSON.stringify(defendDemo, null, 2)}
\`\`\`

---

For ${BattleAction.SKILL} action, respond in following format:
\`\`\`
${JSON.stringify(skillDemo, null, 2)}
\`\`\`

---

For ${BattleAction.SPELL} action, respond in following format:
\`\`\`
${JSON.stringify(spellDemo, null, 2)}
\`\`\`
Another example:
\`\`\`
${JSON.stringify(spellDemo1, null, 2)}
\`\`\`
---

For ${BattleAction.SPIRIT} action, respond in following format:
\`\`\`
${JSON.stringify(spiritDemo, null, 2)}
\`\`\`
Note that you can turn the Spirit Stance off by setting the \`enable\` field to false.

---

For ${BattleAction.ITEMS} action, respond in following format:
\`\`\`
${JSON.stringify(itemsDemo, null, 2)}
\`\`\`
---

For ${BattleAction.FOCUS} action, respond in following format:
\`\`\`
${JSON.stringify(focustDemo, null, 2)}
\`\`\`

Note that \`target\` field could refer to player self or monsters, if referring to player self, than set it to "_player_", otherwise(referring to monster) set it to the monster name recorded in the battle report.`
}
export const fightStyleInitPromptBuilder = () => `There are also some useful tips provided to you to keep you more informed to decide what actions to make.
${BattleAction.SKILL}: As a ${FightStyle.OneHanded} style player, you should try to persist Spirit Stance as often as possible, which means you should try to avoid using weapon skills because they will consume your overcharge. You can use ${InnateSkill.Scan} to get missing information of a monster, but **dont scan a monster other than boss type and use ${InnateSkill.Scan} as less often as possibe** because it only brings you very little benefits.
${BattleAction.ITEMS}: persist ${RestorativeSlotItem.HealthDraught} buff all the time to maintain your HP a safe watermark. Use ${RestorativeSlotItem.ManaDraught} if your mana runs low. Use ${RestorativeSlotItem.SpiritDraught} only if you find your SP is about to run out, 
${BattleAction.SPELL}: persist ${[SupportiveSpell.Protection, SupportiveSpell.Heartseeker, SupportiveSpell.Regen].join(",")} buff all the time, because they provide defense and damage enhancement
${BattleAction.DEFEND}: only use ${BattleAction.DEFEND} as last resort when you find yourself in HP danger yet ${SupportiveSpell.Cure} spell and ${SupportiveSpell.FullCure} spell in cool down and all other instant healing options(such as ${RestorativeSlotItem.HealthPotion}, ${RestorativeSlotItem.HealthElixir}) unavailable
${BattleAction.FOCUS}: do not use ${BattleAction.FOCUS} unless you are wizard
`


export function buildTurnPrompt(battleSigRep: BattleSigRep) {
    return `It is now your turn to move! Below is the battle report:
\`\`\`
${JSON.stringify(battleSigRep, null, 2)}
\`\`\`
Note that the action player can perfrom is recored in the \`availableAction\` field, which is a map from action type to action name. The available ${BattleAction.SKILL}/${BattleAction.SPELL}/${BattleAction.ITEMS} list is listed above in battle report

you have to choose an action to fight or flight. below is the description for each type of action:
- ${BattleAction.ATTACK}: player attacks a monster with their weapon
- ${BattleAction.SKILL}: player uses a skill from their available skill list.
- ${BattleAction.SPELL}: player uses a spell from their available spell list.
- ${BattleAction.ITEMS}: player uses an item from their item list.
- ${BattleAction.SPIRIT}: player toggles Spirit Stance. Note that you need at least 20% of \`%overcharge\` to enable it and persisting Spirit Stance will cost both SP and overcharge continuously
- ${BattleAction.DEFEND}: player defends against an attack
- ${BattleAction.FOCUS}: player focuses on a monster to attack it next turn

${fightStyleInitPromptBuilder()}

${buildTurnRespondFormatPrompt()}

Please give a brief analyze and reason process first, DO NOT just jump to a conclusion! Then you can output your action at the end of your response.
You dont want to list other spare or alternative actions in your response, only the sole action you decide to perform.
`
}
