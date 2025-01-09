export enum MagicDamageType {
    Fire = "fire",
    Cold = "code",
    Elec = "elec",
    Wind = "wind",
    Holy = "holy",
    Dark = "dark"
}

export enum PhysicDamageType {
    Crushing = "crushing",
    Slashing = "slashing",
    Piercing = "piercing",
    Void = "void"
}

export enum FightStyle {
    OneHanded = "one-handed",
    TwoHanded = "two-handed",
    DualWielding = "dual wielding",
    Staff = "staff"
}

export enum ArmorStyle {
    ClothArmour = "cloth armour",
    LightArmour = "light armour",
    HeavyArmour = "heavy armour"
}

export enum SpellStyle {
    Elemental = "elemental",
    Divine = "divine",
    Forbidden = "forbidden",
    Deprecating = "deprecating",
    Supportive = "supportive"
}

export type DamageType = MagicDamageType | PhysicDamageType;


