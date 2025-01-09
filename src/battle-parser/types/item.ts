export enum PowerupSlotItem {
    MysticGem,
    HealthGem,
    ManaGem,
    SpiritGem,
}

export enum RestorativeSlotItem {
    HealthDraught,
    HealthPotion,
    HealthElixir,
    ManaDraught,
    ManaPotion,
    ManaElixir,
    SpiritDraught,
    SpiritPotion,
    SpiritElixir,

    EnergyDrink,
    CaffeinatedCandy,
    LastElixir,

    BubbleGum,
    FlowerVase
}

export enum InfusionSlotItem {
    Flames,
    Frost,
    Lightning,
    Storms,
    Divinity,
    Darkness,
}

export enum ScrollSlotItem {
    Swiftness,
    Protection,
    Shadows,
    TheAvatar,
    Absorption,
    Life,
    TheGods
}

export type BattleToolkit = PowerupSlotItem | RestorativeSlotItem | InfusionSlotItem | ScrollSlotItem;