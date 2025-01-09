import { FightStyle, ArmorStyle, SpellStyle, DamageType, MagicDamageType } from "./common";

export type Vital = {
    health: number;
    magic: number;
    magicRegenPerTick: number;
    spirit: number;
    spiritRegenPerTick: number;
}

export type FightStyleStats = {
    type: FightStyle;
    overwhelmingStrikesOnHitChance?: number;
    counterAttackOnBlockOrParryChance?: number
}

export type EffectivePrimaryStats = {
    strength: number;
    dexterity: number;
    agility: number;
    endurance: number;
    intelligence: number;
    wisdom: number
}

export type EffectiveProficiency = {
    type: FightStyle | ArmorStyle | SpellStyle;
    proficiency: number;
}

export type PhysicAttack = {
    type: "physical",
    baseDamage: number;
    hitChance: number;
    critChance: number;
    attackSpeedBonus: number
}

export type MagicalAttack = {
    type: "magical",
    baseDamage: number;
    hitChance: number;
    critChance: number;
    manaCostModifier: number
    castSpeedBonus: number
}

export type Attack = PhysicAttack | MagicalAttack

export type Defense = {
    physicalMitigationPercent: number;
    magicalMitigationPercent: number;
    evadeChance: number;
    blockChance: number;
    parryChance: number;
    resistChance: number
}

export type SpecificMitigation = {
    damageType: DamageType;
    percent: number
}

export type MagicDamageSpellBonus = {
    type: MagicDamageType
    bonusPercent: number
}

export type PlayerStats = {
    vitalRegenRate: Pick<Vital, "magicRegenPerTick" | "spiritRegenPerTick">
    fightStyle: FightStyleStats;
    psychicAttack: PhysicAttack;
    magicalAttack: MagicalAttack;
    Defense: Defense;
    specificMitigation: SpecificMitigation[];
    magicDamageSpellBonus:  MagicDamageSpellBonus[];
}

export type MonsterStats = {
    id: number;
    name: string;
    attack: DamageType;
    piercing: number;
    slashing: number;
    cold: number;
    wind: number;
    elec: number;
    fire: number;
    dark: number;
    holy: number;
}