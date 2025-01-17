import { BattleSigRep } from "../../../battle-parser/src/index.js";
import { FightStyle, MagicDamageType, PhysicDamageType, BattleAction } from "../../../battle-parser/types/common.js";
import { FightingStyleEffect, ItemEffect, PlayerEffect, SpellEffect, WeaponSkillEffect } from "../../../battle-parser/types/effect.js";
import { RestorativeSlotItem, ScrollSlotItem } from "../../../battle-parser/types/item.js";
import { OneHandedWeaponSkill } from "../../../battle-parser/types/skill.js";
import { DeprecatingSpell, ElecSpell, FireSpell, SupportiveSpell, WindSpell } from "../../../battle-parser/types/spell.js";
import { MonsterStats, PlayerStats } from "../../../battle-parser/types/stats.js"

const playerStatsDemo: PlayerStats = {
    vitalRegenRate: {
        magicRegenPerTick: 0,
        spiritRegenPerTick: 0
    },
    fightStyle: {
        type: FightStyle.OneHanded,
        "%overwhelmingStrikesOnHitChance": 0,
        "%counterAttackOnBlockOrParryChance": 0
    },
    psychicAttack: {
        type: "physical",
        baseDamage: 0,
        "%hitChance": 0,
        "%critChance": 0,
        "%attackSpeedBonus": 0,
    },
    magicalAttack: {
        type: "magical",
        baseDamage: 0,
        "%hitChance": 0,
        "%critChance": 0,
        "%manaCostModifier": 0,
        "%castSpeedBonus": 0,
    },
    defense: {
        "%physicalMitigationPercent": 0,
        "%magicalMitigationPercent": 0,
        "%evadeChance": 0,
        "%blockChance": 0,
        "%parryChance": 0,
        "%resistChance": 0,
    },
    specificMitigation: [
        {
            damageType: MagicDamageType.Fire,
            "%percent": 0,
        },
        {
            damageType: MagicDamageType.Cold,
            "%percent": 0,
        },
        {
            damageType: MagicDamageType.Elec,
            "%percent": 0,
        },               
        {
            damageType: MagicDamageType.Wind,
            "%percent": 0,
        },
        {
            damageType: MagicDamageType.Holy,
            "%percent": 0,
        },
        {
            damageType: MagicDamageType.Dark,
            "%percent": 0,
        },               
        {
            damageType: PhysicDamageType.Crushing,
            "%percent": 0,
        },
        {
            damageType: PhysicDamageType.Slashing,
            "%percent": 0,
        },
        {
            damageType: PhysicDamageType.Piercing,
            "%percent": 0,
        },
        {
            damageType: PhysicDamageType.Void,
            "%percent": 0,
        }
    ],
    magicDamageSpellBonus: [
        {
            type: MagicDamageType.Fire,
            "%bonusPercent": 0,
        },
        {
            type: MagicDamageType.Cold,
            "%bonusPercent": 0,
        },
        {
            type: MagicDamageType.Elec,
            "%bonusPercent": 0,
        },
        {
            type: MagicDamageType.Wind,
            "%bonusPercent": 0,
        },
        {
            type: MagicDamageType.Holy,
            "%bonusPercent": 0,
        },
        {
            type: MagicDamageType.Dark,
            "%bonusPercent": 0,
        }
    ]
}

const monstersStatsDemo: MonsterStats[] = [
    {
        id: 81535,
        name: "Beta-gravis 00a",
        attack: MagicDamageType.Cold,
        piercing: 0,
        slashing: 0,
        cold: 0,
        wind: 0,
        elec: 0,
        fire: 0,
        dark: 0,
        holy: 0
    },
    {
        id: 100147,
        name: "Alpha-gravis 011",
        attack: MagicDamageType.Cold,
        piercing: 0,
        slashing: 0,
        cold: 0,
        wind: 0,
        elec: 0,
        fire: 0,
        dark: 0,
        holy: 0
    }
]

const battleSigrepDemo: BattleSigRep = {
    player: {
        vital: {
            health: 1000,
            magic: 400,
            spirit: 100,
            "%overcharge": 0,
        },
        isInSpiritStance: false,
        effects: [ItemEffect.Refreshment, ItemEffect.Replenishment, FightingStyleEffect.OverwhelmingStrikes]
    },
    monsters: [{
        name: "Beta-gravis 00a",
        vital: {
            "%healthPercent": 0.5,
            "%magicPercent": 0.5,
            "%spiritPercent": 0.1
        },
        effects: [SpellEffect.BluntedAttack, SpellEffect.FreezingLimbs, WeaponSkillEffect.Stunned]
    },
    {
        name: "Alpha-gravis 011",
        vital: {
            "%healthPercent": 0.2,
            "%magicPercent": 0.1,
            "%spiritPercent": 0.9
        },
        effects: [DeprecatingSpell.Silence, DeprecatingSpell.Drain, DeprecatingSpell.Weaken]
    }],
    battleLogs: [
        "Spawned Monster C: MID=197637 (Xperia R1 Plus) LV=166 HP=8516",
        "Initializing arena challenge #11 (Round 1 / 12) ..."
    ],
    availableAction: {
        [BattleAction.ATTACK]: "attack",
        [BattleAction.DEFEND]: "defend",
        [BattleAction.FOCUS]: "focus",
        [BattleAction.SPIRIT]: "spirit",
        [BattleAction.SKILL]: [OneHandedWeaponSkill.ShieldBash, OneHandedWeaponSkill.MercifulBlow, OneHandedWeaponSkill.VitalStrike],
        [BattleAction.SPELL]: [FireSpell.FieryBlast, ElecSpell.Shockblast, WindSpell.Gale, SupportiveSpell.Regen, SupportiveSpell.Protection, DeprecatingSpell.Drain, DeprecatingSpell.Silence, DeprecatingSpell.Weaken],
        [BattleAction.ITEMS]: [RestorativeSlotItem.HealthDraught, RestorativeSlotItem.ManaDraught, RestorativeSlotItem.SpiritDraught, ScrollSlotItem.Protection, ScrollSlotItem.Shadows]
    }
}

export const systemInitPromptBuilder = () => `You are going to play a roleplaying game where you are a player in battles against monsters.
The game is like pokemon battle, but with monsters instead of pokemon. In this game, a battle is consisted of multiple rounds. A round has a number of turns.
Turns are divided into player turns and monsters turns, for player turn you can only execute one action, for monsters turn, all monsters attack you simultaneously, then gets back to next player turn, making it a interaction loop.
Because you can't do anything in monsters turn, from here on now we only focus on player turn, hence the follwing will abbreviate the player turn as "turn" only.
Victory Condition: You win the battle if you eliminate(doing harm to make monster HP drop to 0) all the monsters in all rounds of a battle.
Defeat Condition: Whenever your HP drops to 0, you are defeated and the battle is over immediately.

If you receive the prompt **You encouter a battle**, that marks the begin of a battle
For each battle, player will be initialized with full amount of HP, MP and SP.

If you receive the prompt **A new round is starting**, that marks the begin of a new round.
For each round, a new group of monsters will be spawned. But player will inherit the HP, MP and SP from the previous round.
Making all the monsters' HP drop to 0 marks the end of current round and a new round to begin. If no more rounds are left, the battle is over and you win the battle.
Player will always get the first turn in a round to perform an action.

If you receive the prompt **Time for a new turn**, that marks a new turn.
For each turn, player will have to perform an action to fight or flight. An action can be one of the following:
- ${BattleAction.ATTACK}: player attacks a monster with their weapon
- ${BattleAction.SKILL}: player uses a skill from their skill list. The full available skill list will be provided
- ${BattleAction.SPELL}: player uses a spell from their spell list. The full available spell list will be provided
- ${BattleAction.ITEMS}: player uses an item from their inventory. The full available item list will be provided
- ${BattleAction.SPIRIT}: player toggles Spirit Stance.
- ${BattleAction.DEFEND}: player defends against an attack
- ${BattleAction.FOCUS}: player focuses on a monster to attack it next turn

For each battle/round/turn to start, you, as the player, will be given different types of reports in JSON format to help you make decisions.
Note that you will see some fields in the report which affixed with "%" percentage sign, which means the value is a percentage and every 100 represents "100%" as a whole.
Detailed report format will be depicted in below section.

---

For each battle start, you will be given a player stats report
The player stats report is in following format:
\`\`\`
${JSON.stringify(playerStatsDemo)}
\`\`\`

---

For each round start, since new monsters are spawned, you will be given a new monsters stats report.
The monsters stats report is in following format:
\`\`\`
${JSON.stringify(monstersStatsDemo)}
\`\`\`

---

For each turn, You will be given a battle report from the game and you will be asked to analyze it and perform an action for next turn
Note that a battle report includes the status quo for both player and monsters.Due to skills or spells, player might gain positive effects and monsters might gain negative effects.
The battle report is in following format:
\`\`\`
${JSON.stringify(battleSigrepDemo)}
\`\`\`
Note that the action player can perfrom is recored in the \`availableAction\` field, which is a map from action type to action name.

---
`

export const fightStyleInitPromptBuilder = () => `There are also some useful tips or practice experience ranging form ${BattleAction.SKILL} usage, ${BattleAction.ITEMS} usage and ${BattleAction.SPELL} usage, provided to you to keep you more informed when deciding what actions to make for each turn.
${BattleAction.SKILL}: As a ${FightStyle.OneHanded} style player, you should try to persist Spirit Stance as often as possible, which means you should try to avoid using weapon skills because they will consume your overcharge
${BattleAction.ITEMS}: persist ${RestorativeSlotItem.HealthDraught} buff all the time to maintain your HP a safe watermark. Use ${RestorativeSlotItem.ManaDraught} if your mana runs low. Use ${RestorativeSlotItem.SpiritDraught} only if you find your SP is about to run out, persisting Spirit Stance costs SP and overcharge continuously
${BattleAction.SPELL}: persist ${[SupportiveSpell.Protection, SupportiveSpell.Heartseeker, SupportiveSpell.Regen].join(",")} buff all the time, because they provide defense and damage enhancement

---
`

export const evaluatePromptBuilder = () => `Before the game starts, i need you to evaluate first, from 0 to 10, how would you grade the system init prompts above? what critical information do you find missing?`

export const roleInitPromptBuilder = () => `Now you are about to start the game, for next prompt a new realtime battle will approach, get ready!`

export default function initPromopt() {
    return {
        systemInit: `${systemInitPromptBuilder()}
${fightStyleInitPromptBuilder()}
`,
        roleInit: roleInitPromptBuilder(),
        evaluate: evaluatePromptBuilder()
    }
}