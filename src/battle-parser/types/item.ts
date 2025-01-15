export enum PowerupSlotItem {
    MysticGem = "mystic gem",
    HealthGem = "health gem",
    ManaGem = "mana gem",
    SpiritGem = "spirit gem",
}

export enum RestorativeSlotItem {
    HealthDraught = "health draught",
    HealthPotion = "health potion",
    HealthElixir = "health elixir",
    ManaDraught = "mana draught",
    ManaPotion = "mana potion",
    ManaElixir = "mana elixir",
    SpiritDraught = "spirit draught",
    SpiritPotion = "spirit potion",
    SpiritElixir = "spirit elixir",

    EnergyDrink = "energy drink",
    CaffeinatedCandy = "caffeinated candy",
    LastElixir = "last elixir",

    BubbleGum = "bubble gum",
    FlowerVase = "flower vase",
}

export enum InfusionSlotItem {
    Flames = "flames",
    Frost = "frost",
    Lightning = "lightning",
    Storms = "storms",
    Divinity = "divinity",
    Darkness = "darkness",
}

export enum ScrollSlotItem {
    Swiftness = "swiftness",
    Protection = "protection",
    Shadows = "shadows",
    TheAvatar = "the avatar",
    Absorption = "absorption",
    Life = "life",
    TheGods = "the gods",
}

export type BattleToolkit = PowerupSlotItem | RestorativeSlotItem | InfusionSlotItem | ScrollSlotItem;