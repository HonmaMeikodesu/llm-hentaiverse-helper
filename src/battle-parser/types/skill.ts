export enum InnateSkill {
    Flee = "flee",
    Scan = "scan",
}

export enum OneHandedWeaponSkill {
    ShieldBash = "shield bash",
    VitalStrike = "vital strike",
    MercifulBlow = "merciful blow"
}

export enum DualWieldingSkill {
    IrisStrike = "iris strike",
    BackStab = "back stab",
    FrenziedBlow = "frenzied blow"
}

export enum TwoHandedWeaponSkill {
    GneatCleave = "great cleave",
    RendingBlow = "rending blow",
    ShatterStrike = "shatter strike"
}

export enum SpecialSkill {
    OrbitalFriendshipCannon = "orbital friendship cannon",
    FUSRODAH = "fusrodah"
}

export enum StaffSkill {
    ConcussiveStrike = "concussive strike",
}

export type WeaponSkill = OneHandedWeaponSkill | TwoHandedWeaponSkill | DualWieldingSkill | StaffSkill | SpecialSkill;

export type Skill = WeaponSkill | InnateSkill;
