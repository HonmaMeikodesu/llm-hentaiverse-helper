import { toNumber } from "lodash";
import { BattleAction } from "../../battle-parser/types/common.js";
import { BattleCommand, LLMBattleAction, LLMBattleItemsAction, LLMBattleSkillAction, LLMBattleSpellAction } from "../types/index.js";
import { closest } from "fastest-levenshtein";
import BattleParser from "../../battle-parser/src/index.js";

async function parseCommandTarget(target: LLMBattleSpellAction["target"], battleParser: BattleParser) {
    if (target === "_player_") {
        return 0;
    } else {
        const monsterList = (await battleParser.getBattleSigRep()).monsters;
        const monsterName = closest(target, monsterList.map(monster => monster.name));
        return monsterList.find(monster => monster.name === monsterName)!.rankIndex;
    }
}

export async function convertBattleActionToServerCommand(battleAction: LLMBattleAction, battleParser: BattleParser, token: string): Promise<BattleCommand> {
    switch (battleAction.action) {
        case BattleAction.ATTACK:
            return {
                type: "battle",
                method: "action",
                token,
                mode: "attack",
                target: await parseCommandTarget(battleAction.target, battleParser),
                skill: 0
            }
        case BattleAction.DEFEND:
            return  {
                type: "battle",
                method: "action",
                token,
                mode: "defend",
                target: 0,
                skill: 0
            }
        case BattleAction.SPIRIT:
            return  {
                type: "battle",
                method: "action",
                token,
                mode: "spirit",
                target: 0,
                skill: 0
            }
        case BattleAction.ITEMS:
            return {
                type: "battle",
                method: "action",
                token,
                mode: "items",
                target: 0,
                skill: "TODO"
            }
        case BattleAction.SKILL:
            return {
                type: "battle",
                method: "action",
                token,
                mode: "skill",
                target: await parseCommandTarget((battleAction as LLMBattleSkillAction).target, battleParser),
                skill: "TODO"
            }
        case BattleAction.SPELL:
            return {
                type: "battle",
                method: "action",
                token,
                mode: "magic",
                target: await parseCommandTarget((battleAction as LLMBattleSpellAction).target, battleParser),
                skill: "TODO"
            }
        case BattleAction.FOCUS:
            return {
                type: "battle",
                method: "action",
                token,
                mode: "focus",
                target: 0,
                skill: 0
            }
    }
}