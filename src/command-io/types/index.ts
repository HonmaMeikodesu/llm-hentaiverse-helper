import { BattleAction } from "../../battle-parser/types/common.js";

export type BattleCommand = {
    type: "battle",
    method: "action",
    token: string,
    mode: "attack" | "defend" | "focus" | "spirit" | "magic" | "items",
    target: number,
    skill: number
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
    target: string;
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
    target: string;
}

export type LLMBattleSpellAction = {
    action: BattleAction.SPELL;
    spellName: string;
    target: string;
}
