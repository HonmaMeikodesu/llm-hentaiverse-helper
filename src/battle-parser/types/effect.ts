export enum SpellEffect {
    // Offensive Effect
    SearingSkin = "searing skin",
    FreezingLimbs = "freezing limbs",
    TurbulentAir = "turbulent air",
    DeepBurns = "deep burns",
    BreachedDefense = "breached defense",
    BluntedAttack = "blunted attack",
    BurningSoul = "burning soul",
    RipenedSoul = "ripened soul",
    // Theft Effect
    VitalTheft = "vital theft",
    EtherTheft = "ether theft",
    SpiritTheft = "spirit theft"
}

export enum WeapoonSkillEffect {
    PenetratedArmor = "penetrated armor",
    BleedingWound = "bleeding wound",
    Stunned = "stunned"
}

export enum FightingStyleEffect {
    // positive(target is player)
    Channeling = "channeling",
    OverwhelmingStrikes = "overwhelming strikes",

    // negative(target is enemy)
    CoalescedMana = "coalesced mana",
    EtherTap = "ether tap"
}

export enum ItemEffect {
    Regeneration = "regeneration",
    Replenishment = "replenishment",
    Refreshment = "refreshment",

    EnergyDrinkEnergized = "energy drink energized",
    CaffeinatedCandyEnergized = "caffeinated candy energized",

    InfusedFlames = "infused flames",
    InfusedWinds = "infused winds",
    InfusedLightning = "infused lightning",
    InfusedStorms = "infused storms",
    InfusedDivinity = "infused divinity",
    InfusedDarkness = "infused darkness",

    KickingAss = "kicking ass",
    SleeperImprint = "sleeper imprint"
}

export type PlayerEffect = ItemEffect | FightingStyleEffect.Channeling | FightingStyleEffect.OverwhelmingStrikes;

export type MonsterEffect = SpellEffect | WeapoonSkillEffect | FightingStyleEffect.CoalescedMana | FightingStyleEffect.EtherTap;