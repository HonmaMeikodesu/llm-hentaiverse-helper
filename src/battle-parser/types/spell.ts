export enum FireSpell {
    FieryBlast = "fiery blast",
    Inferno = "inferno",
    FlamesofLoki = "flames of loki",
}

export enum CodeSpell {
    Freeze = "freeze",
    Blizzard = "blizzard",
    Fimbulvetr = "fimbulvetr"
}

export enum ElecSpell {
    Shockblast = "shockblast",
    ChainedLightning = "chained lightning",
    WrathofThor = "wrath of thor",
}

export enum WindSpell {
    Gale = "gale",
    Downburst = "downburst",
    StormsofNjord = "storms of njord",
}

export type ElementalSpell = FireSpell | CodeSpell | ElecSpell | WindSpell;

export enum DivineSpell {
    Smite = "smite",
    Banishment = "banishment",
    ParadiseLost = "paradise lost"
}

export enum ForbiddenSpell {
    Corruption = "corruption",
    Disintegrate = "disintegrate",
    Ragnarok = "ragnarok"
}

export type OffensiveSpell = ElementalSpell | DivineSpell | ForbiddenSpell;

export enum ElementalMagicAugment {
    // TODO
}

export enum DivineMagicAugment {
    // TODO
}

export enum ForbiddenMagicAugment {
    // TODO
}

export enum DeprecatingSpell {
    Drain = "drain",
    Slow = "slow",
    Weaken = "weaken",
    Sleep = "sleep",
    Confuse = "confuse",
    Imperil = "imperil",
    Blind = "blind",
    Silence = "silence",
    MagNet = "magnet",
}

export enum DrainAugment {
    EtherTheft = "ether theft",
    SpiritTheft = "spirit theft"
}

export enum ImperilAugment {
    DarkImperil = "dark imperil",
    HolyImperil = "holy imperil"
}

export enum SupportiveSpell {
    Cure = "cure",
    Regen = "regen",
    FullCure = "full cure",
    Protection = "protection",
    Haste = "haste",
    ShadowVeil = "shadow veil",
    Absorb = "absorb",
    SparkOfLife = "spark of life",
    ArcaneFocus = "arcane focus",
    Heartseeker = "heartseeker",
    SpiritShield = "spirit shield",
}

export enum ProtectionAugment {
    // fire
    FlameSpike = "flame spike",
    // cold 
    FrostSpikes = "frost spikes",
    // elec
    ShockSpikes = "shock spikes",
    // wind
    StormSpikes = "storm spikes"
}

export type Spell = OffensiveSpell | DeprecatingSpell | SupportiveSpell;