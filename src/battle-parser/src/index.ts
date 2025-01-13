import { parseHTML } from "linkedom"
import { MonsterStats, PlayerStats } from "../types/stats.js"
import { MonsterSigRep, PlayerSigRep } from "../types/battle.js";
import { DamageType, FightStyle, MagicDamageType, PhysicDamageType } from "../types/common.js";
import { findLast, lowerCase, merge, toNumber, trim } from "lodash";
import { calcLevenshteinDistance } from "./utils.js";
import { FightingStyleEffect, ItemEffect, MonsterEffect, PlayerEffect, SpellEffect, WeapoonSkillEffect } from "../types/effect.js";
import { DeprecatingSpell, SupportiveSpell } from "../types/spell.js";

type BattleSigRep = {
    player: PlayerSigRep
    monsters: Array<MonsterSigRep & Pick<MonsterStats, "name">>
}

function pickNearestEnumValueForTarget<T>(e: Object, target: string): T {
    let minDist = Number.MAX_SAFE_INTEGER;
    let ret: T = null as never;
    Object.values(e).forEach((item) => {
        const dist = calcLevenshteinDistance(item, lowerCase(trim(target)));
        if (dist < minDist) {
            minDist = dist;
            ret = item;
        }
    });
    return ret;
}

export class BattleParser {

    private monsterDatas: MonsterStats[]

    async initMonsterDatabase() {
        const res: Array<{
            monsterId: number;
            created_at: string;
            monsterClass: "Elemental" | "Arthropod" | "Giant" | "Dragonkin" | "Sprite" | "Celestial" | "Avion" | "Beast" | "Undead" | "Mechanoid" | "Daimon" | "Reptilian" | "Humanoid" | "Common" | "Rare" | "Legendary" | "Ultimate";
            monsterName: string;
            plvl: number;
            attack: "Cold" | "Piercing" | "Crushing" | "Slashing" | "Wind" | "Elec" | "Fire" | "Void" | "Dark" | "Holy";
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
            lastUpdate: string
        }> = JSON.parse(await (await fetch("https://hv-monsterdb-data.skk.moe/persistent.json")).text())
        

        this.monsterDatas = res.map(monster => ({
            id: monster.monsterId,
            name: monster.monsterName,
            attack: monster.attack.toLowerCase() as DamageType,
            piercing: monster.piercing,
            slashing: monster.slashing,
            cold: monster.cold,
            wind: monster.wind,
            elec: monster.elec,
            fire: monster.fire,
            dark: monster.dark,
            holy: monster.holy
        }))
    }

    async getPlayerStats(): Promise<PlayerStats> {
        const { document } = parseHTML(await ((await fetch("")).text()));

        const list = [ ...document.querySelectorAll(".fc2.fal.fcb") ];

        return {
            vitalRegenRate: {
                magicRegenPerTick: toNumber(list.find(item => item.textContent = "magic regen per tick")?.previousSibling?.textContent),
                spiritRegenPerTick: toNumber(list.find(item => item.textContent = "spirit regen per tick")?.previousSibling?.textContent),
            },
            fightStyle: {
                type: pickNearestEnumValueForTarget(FightStyle, list.find(item => item.textContent === "Fighting Style")?.nextSibling?.textContent!),
                overwhelmingStrikesOnHitChance: toNumber(list.find(item => item.textContent === "% Overwhelming Strikes on hit")?.previousSibling?.textContent) / 100,
                counterAttackOnBlockOrParryChance: toNumber(list.find(item => item.textContent === "% Counter-Attack on block/parry")?.previousSibling?.textContent) / 100
            },
            psychicAttack: {
                type: "physical",
                baseDamage: toNumber(list.find(item => item.textContent === "attack base damage")?.previousSibling?.textContent),
                hitChance: toNumber(list.find(item => item.textContent === "% hit chance")?.previousSibling?.textContent) / 100,
                critChance: toNumber(list.find(item => item.textContent === "% crit chance / +50 % damage")?.previousSibling?.textContent) / 100,
                attackSpeedBonus: toNumber(list.find(item => item.textContent === "% attack speed bonus")?.previousSibling?.textContent) / 100,
            },
            magicalAttack: {
                type: "magical",
                baseDamage: toNumber(list.find(item => item.textContent === "magic base damage")?.previousSibling?.textContent),
                hitChance: toNumber(findLast(list, item => item.textContent === "% hit chance")?.previousSibling?.textContent) / 100,
                critChance: toNumber(findLast(list, item => item.textContent === "% crit chance / +50 % damage")?.previousSibling?.textContent) / 100,
                manaCostModifier: toNumber(list.find(item => item.textContent === "% mana cost modifier")?.previousSibling?.textContent) / 100,
                castSpeedBonus: toNumber(list.find(item => item.textContent === "% cast speed bonus")?.previousSibling?.textContent) / 100
            },
            Defense: {
                physicalMitigationPercent: toNumber(list.find(item => item.textContent === "% physical mitigation")?.previousSibling?.textContent) / 100,
                magicalMitigationPercent: toNumber(list.find(item => item.textContent === "% magical mitigation")?.previousSibling?.textContent) / 100,
                evadeChance: toNumber(list.find(item => item.textContent === "% evade chance")?.previousSibling?.textContent) / 100,
                blockChance: toNumber(list.find(item => item.textContent === "% block chance")?.previousSibling?.textContent) / 100,
                parryChance: toNumber(list.find(item => item.textContent === "% parry chance")?.previousSibling?.textContent) / 100,
                resistChance: toNumber(list.find(item => item.textContent === "% resist chance")?.previousSibling?.textContent) / 100
            },
            specificMitigation: [
                {
                    damageType: MagicDamageType.Fire,
                    percent: toNumber(list.find(item => item.textContent === "% fire")?.previousSibling?.textContent) / 100,
                },
                {
                    damageType: MagicDamageType.Cold,
                    percent: toNumber(list.find(item => item.textContent === "% cold")?.previousSibling?.textContent) / 100,
                },
                {
                    damageType: MagicDamageType.Elec,
                    percent: toNumber(list.find(item => item.textContent === "% elec")?.previousSibling?.textContent) / 100,
                },               
                {
                    damageType: MagicDamageType.Wind,
                    percent: toNumber(list.find(item => item.textContent === "% wind")?.previousSibling?.textContent) / 100,
                },
                {
                    damageType: MagicDamageType.Holy,
                    percent: toNumber(list.find(item => item.textContent === "% holy")?.previousSibling?.textContent) / 100,
                },
                {
                    damageType: MagicDamageType.Dark,
                    percent: toNumber(list.find(item => item.textContent === "% dark")?.previousSibling?.textContent) / 100,
                },               
                {
                    damageType: PhysicDamageType.Crushing,
                    percent: toNumber(list.find(item => item.textContent === "% crushing")?.previousSibling?.textContent) / 100,
                },
                {
                    damageType: PhysicDamageType.Slashing,
                    percent: toNumber(list.find(item => item.textContent === "% slashing")?.previousSibling?.textContent) / 100,
                },
                {
                    damageType: PhysicDamageType.Piercing,
                    percent: toNumber(list.find(item => item.textContent === "% piercing")?.previousSibling?.textContent) / 100,
                },
                {
                    damageType: PhysicDamageType.Void,
                    percent: toNumber(list.find(item => item.textContent === "% void")?.previousSibling?.textContent) / 100,
                }
            ],
            magicDamageSpellBonus: [
                {
                    type: MagicDamageType.Fire,
                    bonusPercent: toNumber(findLast(list, item => item.textContent === "% fire")?.previousSibling?.textContent) / 100,
                },
                {
                    type: MagicDamageType.Cold,
                    bonusPercent: toNumber(findLast(list, item => item.textContent === "% cold")?.previousSibling?.textContent) / 100,
                },
                {
                    type: MagicDamageType.Elec,
                    bonusPercent: toNumber(findLast(list, item => item.textContent === "% elec")?.previousSibling?.textContent) / 100,
                },
                {
                    type: MagicDamageType.Wind,
                    bonusPercent: toNumber(findLast(list, item => item.textContent === "% wind")?.previousSibling?.textContent) / 100,
                },
                {
                    type: MagicDamageType.Holy,
                    bonusPercent: toNumber(findLast(list, item => item.textContent === "% holy")?.previousSibling?.textContent) / 100,
                },
                {
                    type: MagicDamageType.Dark,
                    bonusPercent: toNumber(findLast(list, item => item.textContent === "% dark")?.previousSibling?.textContent) / 100,
                }
            ]
        }
    }

    async getMonsterStats(name: string) {
        return this.monsterDatas.find(monster => monster.name === name);
    }

    async parseBattleSigRep(battlePage: string): Promise<BattleSigRep> {
        const { document } = parseHTML(battlePage);

        const q = document.querySelector;
        const qa = document.querySelectorAll;

        const playerSigRep: BattleSigRep["player"] = {
            vital: {
                health: toNumber(q("#vrhb")?.textContent),
                magic: toNumber(q("#vrm")?.textContent),
                spirit: toNumber(q("#vrs")?.textContent),
                overcharge: toNumber(q<HTMLDivElement>("#vcp div")?.style?.width?.match(/\d+/)![0]) / 19
            },
            effects: [ ...qa<HTMLImageElement>("#pane_effects img") ].map((img) => {
                const effect: PlayerEffect = pickNearestEnumValueForTarget(merge(ItemEffect, FightingStyleEffect, SupportiveSpell), img.attributes.getNamedItem("onmouseover")!.textContent!.match(/set_infopane_effect\('(.*?)'/)![1]);
                return effect;
            })
        };

        const monsterSigReps: BattleSigRep["monsters"] = [...qa("#pane_monster > div")].map((div) => {
            return {
                name: div.querySelector("#btm3m div div")!.textContent || "",
                vital: {
                    healthPercent: toNumber(div.querySelector<HTMLImageElement>("img[alt='health']")?.style?.width.match(/\d+/)![0]) / 120,
                    magicPercent: toNumber(div.querySelector<HTMLImageElement>("img[alt='magic']")?.style?.width.match(/\d+/)![0]) / 120,
                    spiritPercent: toNumber(div.querySelector<HTMLImageElement>("img[alt='spirit']")?.style?.width.match(/\d+/)![0]) / 120,
                },
            effects: [ ...qa<HTMLImageElement>("#pane_monster .btm6 img") ].map((img) => {
                const effect: MonsterEffect = pickNearestEnumValueForTarget(merge(SpellEffect, WeapoonSkillEffect, FightingStyleEffect, DeprecatingSpell ), img.attributes.getNamedItem("onmouseover")!.textContent!.match(/set_infopane_effect\('(.*?)'/)![1]);
                return effect;
            })
            }
        });

        return {
            player: playerSigRep,
            monsters: monsterSigReps
        }
    }
}