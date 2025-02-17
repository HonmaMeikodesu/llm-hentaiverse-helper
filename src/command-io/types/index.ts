import { BattleAction } from "../../battle-parser/types/common.js";

export type BattleCommand = {
    type: "battle",
    method: string,
    token: string,
    mode: string,
    target: number,
    skill: number | string
}

export type LLMBattleAction =
    LLMBattleAttackAction
    | LLMBattleItemsAction
    | LLMBattleSpiritAction
    | LLMBattleDefendAction
    | LLMBattleFocusAction
    | LLMBattleSkillAction
    | LLMBattleSpellAction;

export type LLMBattleAttackAction = {
    action: BattleAction.ATTACK;
    target: `monster_${string}`;
}

export type LLMBattleItemsAction = {
    action: BattleAction.ITEMS;
    itemName: string;
}

export type LLMBattleSpiritAction = {
    action: BattleAction.SPIRIT;
    enable: boolean;
}

export type LLMBattleDefendAction = {
    action: BattleAction.DEFEND;
}

export type LLMBattleFocusAction = {
    action: BattleAction.FOCUS;
}

export type LLMBattleSkillAction = {
    action: BattleAction.SKILL;
    skillName: string;
    target: "player" | `monster_${string}`;
}

export type LLMBattleSpellAction = {
    action: BattleAction.SPELL;
    spellName: string;
    target: "player" | `monster_${string}`;
}
