import { parseHTML } from "linkedom";
import { MonsterStats, PlayerStats } from "../types/stats.js";
import { MonsterSigRep, PlayerSigRep } from "../types/battle.js";
import {
    BattleAction,
    DamageType,
    FightStyle,
    MagicDamageType,
    PhysicDamageType,
} from "../types/common.js";
import {
    findLast,
    isUndefined,
    lowerCase,
    merge,
    toNumber,
    trim,
} from "lodash";
import { closest } from "fastest-levenshtein";
import {
    FightingStyleEffect,
    ItemEffect,
    MonsterEffect,
    PlayerEffect,
    SpellEffect,
    WeaponSkillEffect,
} from "../types/effect.js";
import {
    ColdSpell,
    DeprecatingSpell,
    DivineSpell,
    ElecSpell,
    FireSpell,
    ForbiddenSpell,
    Spell,
    SupportiveSpell,
    WindSpell,
} from "../types/spell.js";
import {
    DualWieldingSkill,
    InnateSkill,
    OneHandedWeaponSkill,
    Skill,
    SpecialSkill,
    StaffSkill,
    TwoHandedWeaponSkill,
} from "../types/skill.js";
import {
    BattleToolkit,
    InfusionSlotItem,
    PowerupSlotItem,
    RestorativeSlotItem,
    ScrollSlotItem,
} from "../types/item.js";

export enum MonsterRarity {
    Ordinary = "Ordinary",
    Boss = "Boss",
    Schoolgirl = "Schoolgirl",
    God = "God",
}

export type BattleSigRep = {
    player: PlayerSigRep;
    monsters: Array<
        MonsterSigRep &
            Pick<MonsterStats, "name"> & { monsterRarity: MonsterRarity }
    >;
    availableAction: {
        [BattleAction.ATTACK]: "attack";
        [BattleAction.DEFEND]: "defend";
        [BattleAction.FOCUS]: "focus";
        [BattleAction.SPIRIT]: "spirit";
        [BattleAction.ITEMS]: BattleToolkit[];
        [BattleAction.SKILL]: Skill[];
        [BattleAction.SPELL]: Spell[];
    };
    battleLogs: string[];
};

function pickNearestEnumValueForTarget<T>(e: Object, target: string): T {
    return closest(lowerCase(trim(target)), Object.values(e)) as T;
}

export default class BattleParser {
    constructor(params: { initBattlePageContent?: string }) {
        this.setBattlePage(params.initBattlePageContent || "");
        this.initMonsterDatabase();
    }

    static ifIsPlayerStatsPage(pageContent: string) {
        const dom = parseHTML(pageContent);
        return !!dom?.document?.querySelector("#stats_pane");
    }

    static ifIsBattlePage(pageContent: string) {
        const dom = parseHTML(pageContent);
        return !!dom?.document?.querySelector("#battle_main");
    }

    private monsterDatas: MonsterStats[];

    private battlePage: Window;

    setBattlePage(battlePageContent: string) {
        this.battlePage = parseHTML(battlePageContent);
    }

    getBattlePage() {
        return this.battlePage;
    }

    async initMonsterDatabase() {
        const res: Array<{
            monsterId: number;
            created_at: string;
            monsterClass:
                | "Elemental"
                | "Arthropod"
                | "Giant"
                | "Dragonkin"
                | "Sprite"
                | "Celestial"
                | "Avion"
                | "Beast"
                | "Undead"
                | "Mechanoid"
                | "Daimon"
                | "Reptilian"
                | "Humanoid"
                | "Common"
                | "Rare"
                | "Legendary"
                | "Ultimate";
            monsterName: string;
            plvl: number;
            attack:
                | "Cold"
                | "Piercing"
                | "Crushing"
                | "Slashing"
                | "Wind"
                | "Elec"
                | "Fire"
                | "Void"
                | "Dark"
                | "Holy";
            trainer: string;
            piercing: number;
            crushing: number;
            slashing: number;
            cold: number;
            wind: number;
            elec: number;
            fire: number;
            dark: number;
            holy: number;
            lastUpdate: string;
        }> = JSON.parse(
            await (
                await fetch("https://hv-monsterdb-data.skk.moe/persistent.json")
            ).text()
        );

        this.monsterDatas = res.map((monster) => ({
            name: monster.monsterName,
            attack: monster.attack.toLowerCase() as DamageType,
            piercing: monster.piercing,
            slashing: monster.slashing,
            cold: monster.cold,
            wind: monster.wind,
            elec: monster.elec,
            fire: monster.fire,
            dark: monster.dark,
            holy: monster.holy,
        }));
    }

    static async getPlayerStats(statsPageContent): Promise<PlayerStats> {
        const { document } = parseHTML(statsPageContent);

        const list = [...document.querySelectorAll("#stats_pane .fc2.fal.fcb")];

        return {
            vitalRegenRate: {
                magicRegenPerTick: toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "magic regen per tick"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                spiritRegenPerTick: toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "spirit regen per tick"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
            },
            fightStyle: {
                type: pickNearestEnumValueForTarget(
                    FightStyle,
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() === "Fighting Style"
                        )?.parentNode as HTMLDivElement
                    )?.nextElementSibling?.textContent!
                ),
                "%overwhelmingStrikesOnHitChance": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "% Overwhelming Strikes on hit"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%counterAttackOnBlockOrParryChance": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "% Counter-Attack on block/parry"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
            },
            psychicAttack: {
                type: "physical",
                baseDamage: toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "attack base damage"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%hitChance": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() === "% hit chance"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%critChance": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "% crit chance / +50 % damage"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%attackSpeedBonus": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "% attack speed bonus"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
            },
            magicalAttack: {
                type: "magical",
                baseDamage: toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() === "magic base damage"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%hitChance": toNumber(
                    (
                        findLast(
                            list,
                            (item) =>
                                item.textContent!.trim() === "% hit chance"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%critChance": toNumber(
                    (
                        findLast(
                            list,
                            (item) =>
                                item.textContent!.trim() ===
                                "% crit chance / +50 % damage"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%manaCostModifier": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "% mana cost modifier"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%castSpeedBonus": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "% cast speed bonus"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
            },
            defense: {
                "%physicalMitigationPercent": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "% physical mitigation"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%magicalMitigationPercent": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() ===
                                "% magical mitigation"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%evadeChance": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() === "% evade chance"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%blockChance": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() === "% block chance"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%parryChance": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() === "% parry chance"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
                "%resistChance": toNumber(
                    (
                        list.find(
                            (item) =>
                                item.textContent!.trim() === "% resist chance"
                        )?.parentNode as HTMLDivElement
                    )?.previousElementSibling?.textContent
                ),
            },
            specificMitigation: [
                {
                    damageType: MagicDamageType.Fire,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) => item.textContent!.trim() === "% fire"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: MagicDamageType.Cold,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) => item.textContent!.trim() === "% cold"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: MagicDamageType.Elec,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) => item.textContent!.trim() === "% elec"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: MagicDamageType.Wind,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) => item.textContent!.trim() === "% wind"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: MagicDamageType.Holy,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) => item.textContent!.trim() === "% holy"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: MagicDamageType.Dark,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) => item.textContent!.trim() === "% dark"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: PhysicDamageType.Crushing,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) =>
                                    item.textContent!.trim() === "% crushing"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: PhysicDamageType.Slashing,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) =>
                                    item.textContent!.trim() === "% slashing"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: PhysicDamageType.Piercing,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) =>
                                    item.textContent!.trim() === "% piercing"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    damageType: PhysicDamageType.Void,
                    "%percent": toNumber(
                        (
                            list.find(
                                (item) => item.textContent!.trim() === "% void"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
            ],
            magicDamageSpellBonus: [
                {
                    type: MagicDamageType.Fire,
                    "%bonusPercent": toNumber(
                        (
                            findLast(
                                list,
                                (item) => item.textContent!.trim() === "% fire"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    type: MagicDamageType.Cold,
                    "%bonusPercent": toNumber(
                        (
                            findLast(
                                list,
                                (item) => item.textContent!.trim() === "% cold"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    type: MagicDamageType.Elec,
                    "%bonusPercent": toNumber(
                        (
                            findLast(
                                list,
                                (item) => item.textContent!.trim() === "% elec"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    type: MagicDamageType.Wind,
                    "%bonusPercent": toNumber(
                        (
                            findLast(
                                list,
                                (item) => item.textContent!.trim() === "% wind"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    type: MagicDamageType.Holy,
                    "%bonusPercent": toNumber(
                        (
                            findLast(
                                list,
                                (item) => item.textContent!.trim() === "% holy"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
                {
                    type: MagicDamageType.Dark,
                    "%bonusPercent": toNumber(
                        (
                            findLast(
                                list,
                                (item) => item.textContent!.trim() === "% dark"
                            )?.parentNode as HTMLDivElement
                        )?.previousElementSibling?.textContent
                    ),
                },
            ],
        };
    }

    async getMonsterStats(name: string) {
        if (isUndefined(this.monsterDatas)) {
            await this.initMonsterDatabase();
        }
        return this.monsterDatas.find((monster) => name === monster.name);
    }

    async getBattleSigRep(): Promise<BattleSigRep> {
        const { document } = this.battlePage;

        const q: typeof document.querySelector =
            document.querySelector.bind(document);
        const qa: typeof document.querySelectorAll =
            document.querySelectorAll.bind(document);

        const playerSigRep: BattleSigRep["player"] = {
            vital: {
                health: toNumber(q("#vrhb")?.textContent),
                magic: toNumber(q("#vrm")?.textContent),
                spirit: toNumber(q("#vrs")?.textContent),
                "%overcharge": Math.round(
                    (toNumber(
                        q<HTMLDivElement>("#vcp div")?.style?.width?.match(
                            /\d+/
                        )![0] || 0
                    ) /
                        190) *
                        250
                ),
            },
            isInSpiritStance:
                !!q<HTMLImageElement>("#ckey_spirit")?.src?.includes(
                    "spirit_a"
                ),
            effects: [...qa<HTMLImageElement>("#pane_effects img")].map(
                (img) => {
                    const effect: PlayerEffect = pickNearestEnumValueForTarget(
                        merge(ItemEffect, FightingStyleEffect, SupportiveSpell),
                        img.attributes
                            .getNamedItem("onmouseover")!
                            .textContent!.match(
                                /set_infopane_effect\('(.*?)'/
                            )![1]
                    );
                    return effect;
                }
            ),
        };

        const monsterSigReps: BattleSigRep["monsters"] = [
            ...qa("#pane_monster > div"),
        ].map((div) => {
            return {
                name: div.querySelector(".btm3 div div")!.textContent || "",
                vital: {
                    "%healthPercent": Math.round(
                        (toNumber(
                            div
                                .querySelector<HTMLImageElement>(
                                    "img[alt='health']"
                                )
                                ?.style?.width.match(/\d+/)![0]
                        ) /
                            120) *
                            100
                    ),
                    "%magicPercent": Math.round(
                        (toNumber(
                            div
                                .querySelector<HTMLImageElement>(
                                    "img[alt='magic']"
                                )
                                ?.style?.width.match(/\d+/)![0]
                        ) /
                            120) *
                            100
                    ),
                    "%spiritPercent": Math.round(
                        (toNumber(
                            div
                                .querySelector<HTMLImageElement>(
                                    "img[alt='spirit']"
                                )
                                ?.style?.width.match(/\d+/)![0]
                        ) /
                            120) *
                            100
                    ),
                },
                rankIndex: toNumber(
                    div
                        .getAttribute("onclick")!
                        .match(/battle.commit_target\((\d+)\)/)![1]
                ),
                // TODO
                monsterRarity: MonsterRarity.Ordinary,
                effects: [
                    ...qa<HTMLImageElement>("#pane_monster .btm6 img"),
                ].map((img) => {
                    const effect: MonsterEffect = pickNearestEnumValueForTarget(
                        merge(
                            SpellEffect,
                            WeaponSkillEffect,
                            FightingStyleEffect,
                            DeprecatingSpell
                        ),
                        img.attributes
                            .getNamedItem("onmouseover")!
                            .textContent!.match(
                                /set_infopane_effect\('(.*?)'/
                            )![1]
                    );
                    return effect;
                }),
            };
        });

        return {
            player: playerSigRep,
            monsters: monsterSigReps,
            battleLogs: [...qa<HTMLTableRowElement>("#textlog tr")].map((td) =>
                td.textContent!.trim()
            ),
            availableAction: {
                [BattleAction.ATTACK]: "attack",
                [BattleAction.DEFEND]: "defend",
                [BattleAction.FOCUS]: "focus",
                [BattleAction.SPIRIT]: "spirit",
                [BattleAction.SKILL]: await this.getAvailabelSkills(),
                [BattleAction.SPELL]: await this.getAvailabelSpells(),
                [BattleAction.ITEMS]: await this.getAvailabelItems(),
            },
        };
    }

    async getItemsMap() {
        const { document } = this.battlePage;

        const slotItems = [
            ...document.querySelectorAll(
                "#pane_item > .c > div:first-child .c"
            ),
        ];
        const itemsMap: Record<BattleToolkit, number> = {} as any;

        slotItems.forEach((item) => {
            const slotIndex = toNumber(item!.querySelector(".bti2")!.textContent!.trim());

            const itemName = pickNearestEnumValueForTarget<BattleToolkit>(
                merge(
                    PowerupSlotItem,
                    RestorativeSlotItem,
                    InfusionSlotItem,
                    ScrollSlotItem
                ),
                item!.querySelector(".bti3")!.textContent!.trim()
            );
            itemsMap[itemName] = slotIndex;
        });
        return itemsMap;
    }

    async getAvailabelSkills() {
        return [
            ...this.battlePage.document.querySelectorAll<HTMLDivElement>(
                "#table_skills .btsd"
            ),
        ]
            .filter((div) => !div.style.opacity && !!div.textContent!.trim())
            .map((item) =>
                pickNearestEnumValueForTarget<Skill>(
                    merge(
                        InnateSkill,
                        OneHandedWeaponSkill,
                        TwoHandedWeaponSkill,
                        DualWieldingSkill,
                        StaffSkill,
                        SpecialSkill
                    ),
                    item.textContent!
                )
            );
    }

    async getAvailabelSpells() {
        return [
            ...this.battlePage.document.querySelectorAll<HTMLDivElement>(
                "#table_magic .btsd"
            ),
        ]
            .filter((div) => !div.style.opacity && !!div.textContent!.trim())
            .map((item) =>
                pickNearestEnumValueForTarget<Spell>(
                    merge(
                        FireSpell,
                        ColdSpell,
                        ElecSpell,
                        WindSpell,
                        DivineSpell,
                        ForbiddenSpell,
                        DeprecatingSpell,
                        SupportiveSpell
                    ),
                    item.textContent!
                )
            );
    }

    async getAvailabelItems() {
        return [
            ...this.battlePage.document.querySelectorAll<HTMLDivElement>(
                "#pane_item .bti3"
            ),
        ]
            .filter((div) => !div.style.opacity && !!div.textContent!.trim())
            .map((item) =>
                pickNearestEnumValueForTarget<BattleToolkit>(
                    merge(
                        PowerupSlotItem,
                        RestorativeSlotItem,
                        InfusionSlotItem,
                        ScrollSlotItem
                    ),
                    item.textContent!
                )
            );
    }
}
