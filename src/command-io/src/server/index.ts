import {
    DualWieldingSkill,
    InnateSkill,
    OneHandedWeaponSkill,
    Skill,
    SpecialSkill,
    StaffSkill,
    TwoHandedWeaponSkill,
} from "../../../battle-parser/types/skill.js";
import {
    ColdSpell,
    DeprecatingSpell,
    DivineSpell,
    ElecSpell,
    FireSpell,
    ForbiddenSpell,
    SupportiveSpell,
    WindSpell,
} from "../../../battle-parser/types/spell.js";
import { BattleCommand } from "../../types/index.js";

export const SKILL_CODE_MAP = {
    [InnateSkill.Flee]: 1001,
    [InnateSkill.Scan]: 1011,
    [OneHandedWeaponSkill.MercifulBlow]: 2203,
    [OneHandedWeaponSkill.ShieldBash]: 2201,
    [OneHandedWeaponSkill.VitalStrike]: 2202,
    [DualWieldingSkill.IrisStrike]: NaN,
    [DualWieldingSkill.BackStab]: NaN,
    [DualWieldingSkill.FrenziedBlow]: NaN,
    [TwoHandedWeaponSkill.GneatCleave]: NaN,
    [TwoHandedWeaponSkill.RendingBlow]: NaN,
    [TwoHandedWeaponSkill.ShatterStrike]: NaN,
    [SpecialSkill.OrbitalFriendshipCannon]: NaN,
    [SpecialSkill.FUSRODAH]: NaN,
    [StaffSkill.ConcussiveStrike]: NaN,
};

export const SPELL_CODE_MAP = {
    // offensive
    [FireSpell.FieryBlast]: 111,
    [FireSpell.Inferno]: 112,
    [FireSpell.FlamesofLoki]: NaN,
    [ColdSpell.Freeze]: 121,
    [ColdSpell.Blizzard]: 122,
    [ColdSpell.Fimbulvetr]: NaN,
    [ElecSpell.Shockblast]: 131,
    [ElecSpell.ChainedLightning]: 132,
    [ElecSpell.WrathofThor]: NaN,
    [WindSpell.Gale]: 141,
    [WindSpell.Downburst]: 142,
    [WindSpell.StormsofNjord]: NaN,
    [DivineSpell.Smite]: 151,
    [DivineSpell.Banishment]: 152,
    [DivineSpell.ParadiseLost]: NaN,
    [ForbiddenSpell.Corruption]: 161,
    [ForbiddenSpell.Disintegrate]: 162,
    [ForbiddenSpell.Ragnarok]: NaN,
    // deprecating
    [DeprecatingSpell.Drain]: 211,
    [DeprecatingSpell.Weaken]: 212,
    [DeprecatingSpell.Imperil]: 213,
    [DeprecatingSpell.Slow]: 221,
    [DeprecatingSpell.Sleep]: 222,
    [DeprecatingSpell.Confuse]: 223,
    [DeprecatingSpell.Blind]: 231,
    [DeprecatingSpell.Silence]: 232,
    [DeprecatingSpell.MagNet]: NaN,
    // supportive
    [SupportiveSpell.Cure]: 311,
    [SupportiveSpell.Regen]: 312,
    [SupportiveSpell.FullCure]: NaN,
    [SupportiveSpell.Protection]: 411,
    [SupportiveSpell.Haste]: 412,
    [SupportiveSpell.ShadowVeil]: 413,
    [SupportiveSpell.Absorb]: 421,
    [SupportiveSpell.SparkOfLife]: 422,
    [SupportiveSpell.ArcaneFocus]: NaN,
    [SupportiveSpell.Heartseeker]: 431,
    [SupportiveSpell.SpiritShield]: NaN,
};

export default class ServerCommand {
    private battleToken: string;

    constructor(params: { battleToken: string }) {
        this.battleToken = params.battleToken;
    }

    attack(target: number): BattleCommand {
        return {
            type: "battle",
            method: "action",
            token: this.battleToken,
            mode: "attack",
            target,
            skill: 0,
        };
    }

    defend(): BattleCommand {
        return {
            type: "battle",
            method: "action",
            token: this.battleToken,
            mode: "defend",
            target: 0,
            skill: 0,
        };
    }

    focus(): BattleCommand {
        return {
            type: "battle",
            method: "action",
            token: this.battleToken,
            mode: "focus",
            target: 0,
            skill: 0,
        };
    }

    spirit(): BattleCommand {
        return {
            type: "battle",
            method: "action",
            token: this.battleToken,
            mode: "spirit",
            target: 0,
            skill: 0,
        };
    }

    skill(params: { skillName: Skill; target: number }): BattleCommand {
        const { skillName, target } = params;

        return {
            type: "battle",
            method: "action",
            token: this.battleToken,
            mode: "magic",
            target: skillName === InnateSkill.Flee ? 0 : target,
            skill: SKILL_CODE_MAP[skillName],
        };
    }

    spell(params: { spellName: string; target: number }): BattleCommand {
        const { spellName, target } = params;

        switch (spellName) {
            case SupportiveSpell.Cure:
            case SupportiveSpell.Regen:
            case SupportiveSpell.FullCure:
            case SupportiveSpell.Protection:
            case SupportiveSpell.Haste:
            case SupportiveSpell.ShadowVeil:
            case SupportiveSpell.Absorb:
            case SupportiveSpell.SparkOfLife:
            case SupportiveSpell.ArcaneFocus:
            case SupportiveSpell.Heartseeker:
            case SupportiveSpell.SpiritShield:
                return {
                    type: "battle",
                    method: "action",
                    token: this.battleToken,
                    mode: "magic",
                    target: 0,
                    skill: SPELL_CODE_MAP[spellName],
                };
            default:
                return {
                    type: "battle",
                    method: "action",
                    token: this.battleToken,
                    mode: "magic",
                    target,
                    skill: SPELL_CODE_MAP[spellName],
                };
        }
    }

    item(params: { slotIdx: number }): BattleCommand {
        const { slotIdx } = params;
        return {
            type: "battle",
            method: "action",
            token: this.battleToken,
            mode: "items",
            target: 0,
            skill: slotIdx,
        };
    }
}

