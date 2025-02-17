import { MonsterEffect, PlayerEffect } from "./effect.js";
import { Vital } from "./stats.js";

export type VitalSigRep = Pick<Vital, "health" | "magic" | "spirit">

export type MonsterVitalSigRep = `%${keyof VitalSigRep}Percent`;

export type MonsterSigRep = {
    vital: {
        [key in MonsterVitalSigRep]: number;
    };
    rankIndex: number;
    effects: MonsterEffect[]
}

export type PlayerSigRep = {
    vital: VitalSigRep & {
        "%overcharge": number;
    };
    isInSpiritStance: boolean;
    effects: PlayerEffect[]
}
