import { toNumber } from "lodash";
import { BattleAction } from "../../battle-parser/types/common.js";
import { BattleCommand, LLMBattleAction, LLMBattleItemsAction, LLMBattleSkillAction, LLMBattleSpellAction } from "../types/index.js";
import BattleParser from "../../battle-parser/src/index.js";

async function parseCommandTarget(target: LLMBattleSpellAction["target"], battleParser: BattleParser) {
    if (target === "player") {
        return 0;
    } else if (target.startsWith("monster_")) {
        const monsterId = toNumber(target.replace("monster_", ""));
        const monsterName = (await battleParser.getMonsterStats({ id: monsterId }))!.name;
        return ( await battleParser.getBattleSigRep() ).monsters.find(monster => monster.name === monsterName)!.rankIndex;
    }
    throw new Error(`Invalid target: ${target}`);
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