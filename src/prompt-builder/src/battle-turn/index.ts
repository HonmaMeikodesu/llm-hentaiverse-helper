import { BattleSigRep } from "../../../battle-parser/src/index.js";
import { BattleAction } from "../../../battle-parser/types/common.js";
import { RestorativeSlotItem } from "../../../battle-parser/types/item.js";
import { InnateSkill, OneHandedWeaponSkill } from "../../../battle-parser/types/skill.js";
import { FireSpell } from "../../../battle-parser/types/spell.js";
import { LLMBattleAttackAction, LLMBattleDefendAction, LLMBattleFocusAction, LLMBattleItemsAction, LLMBattleSkillAction, LLMBattleSpellAction, LLMBattleSpiritAction } from "../../../command-io/types/index.js";

const attackDemo: LLMBattleAttackAction = {
    action: BattleAction.ATTACK,
    target: "monster_112698"
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
    target: "monster_112698",
};

const spellDemo: LLMBattleSpellAction = {
    action: BattleAction.SPELL,
    spellName: FireSpell.FieryBlast,
    target: "monster_53321",
};

export function buildTurnRespondFormatPrompt() {
    return `For each turn, you have to perform an action, to make your action output parsable and understandable by code, each type of action has its own fixated format, which all are JSON.
Note that target field could refer to player self or monsters, if referring to player, than set it to "player", otherwise(referring to monster) sticks to this format: "monster_\${monsterId}", you can get monsterId from the monsters stats report.

For ${BattleAction.ATTACK} action, respond in following format:
${JSON.stringify(attackDemo, null, 2)}
---

For ${BattleAction.DEFEND} action, respond in following format:
${JSON.stringify(defendDemo, null, 2)}

---

For ${BattleAction.SKILL} action, respond in following format:
${JSON.stringify(skillDemo, null, 2)}

---

For ${BattleAction.SPELL} action, respond in following format:
${JSON.stringify(spellDemo, null, 2)}

---

For ${BattleAction.SPIRIT} action, respond in following format:
${JSON.stringify(spiritDemo, null, 2)}
Note that you can turn the Spirit Stance off by setting the enable field to false.

---

For ${BattleAction.ITEMS} action, respond in following format:
${JSON.stringify(itemsDemo, null, 2)}

---

For ${BattleAction.FOCUS} action, respond in following format:
${JSON.stringify(focustDemo, null, 2)}
`
}

export function buildTurnPrompt(battleSigRep: BattleSigRep) {
    return `It is now your turn to move! Below is the battle report:
${JSON.stringify(battleSigRep, null, 2)}
Please respond with the action you decide to perform in the specific JSON format designated at system prompt.
`
}