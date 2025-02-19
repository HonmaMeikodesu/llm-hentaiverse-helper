import { BattleAction } from "../../battle-parser/types/common.js";
import {
    BattleCommand,
    LLMBattleAction,
    LLMBattleItemsAction,
    LLMBattleSkillAction,
    LLMBattleSpellAction,
} from "../types/index.js";
import { closest } from "fastest-levenshtein";
import BattleParser from "../../battle-parser/src/index.js";
import { ServerCommand, SKILL_CODE_MAP, SPELL_CODE_MAP } from "../src/index.js";
import { Skill } from "../../battle-parser/types/skill.js";
import { Spell } from "../../battle-parser/types/spell.js";

async function parseCommandTarget(
    target: LLMBattleSpellAction["target"],
    battleParser: BattleParser
) {
    if (target === "_player_") {
        return 0;
    } else {
        const monsterList = (await battleParser.getBattleSigRep()).monsters;
        const monsterName = closest(
            target,
            monsterList.map((monster) => monster.name)
        );
        return monsterList.find((monster) => monster.name === monsterName)!
            .rankIndex;
    }
}

async function parseItem(itemName: string, battleParser: BattleParser) {
    const itemsMap = await battleParser.getItemsMap();
    return itemsMap[closest(itemName, Object.keys(itemsMap))];
}

function parseSkillName(skillName: string): Skill {
    return closest(skillName, Object.keys(SKILL_CODE_MAP)) as Skill;
}

function parseSpellName(spellName: string): Spell {
    return closest(spellName, Object.keys(SPELL_CODE_MAP)) as Spell;
}

export async function convertBattleActionToServerCommand(
    battleAction: LLMBattleAction,
    battleParser: BattleParser,
    token: string
): Promise<BattleCommand> {
    const serverCommand = new ServerCommand({ battleToken: token });
    const target = await parseCommandTarget(
        (battleAction as LLMBattleSkillAction).target,
        battleParser
    );
    const slotIdx = await parseItem(
        (battleAction as LLMBattleItemsAction)?.itemName,
        battleParser
    );
    switch (battleAction.action) {
        case BattleAction.ATTACK:
            return serverCommand.attack(target);
        case BattleAction.DEFEND:
            return serverCommand.defend();
        case BattleAction.SPIRIT:
            return serverCommand.spirit();
        case BattleAction.ITEMS:
            return serverCommand.item({ slotIdx });
        case BattleAction.SKILL:
            return serverCommand.skill({
                skillName: parseSkillName(battleAction.skillName),
                target,
            });
        case BattleAction.SPELL:
            return serverCommand.spell({
                spellName: parseSpellName(battleAction.spellName),
                target,
            });
        case BattleAction.FOCUS:
            return serverCommand.focus();
    }
}
