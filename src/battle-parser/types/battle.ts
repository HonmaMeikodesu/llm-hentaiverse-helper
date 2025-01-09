import { MonsterEffect, PlayerEffect } from "./effect";
import { Vital } from "./stats";

export type VitalSigRep = Pick<Vital, "health" | "magic" | "spirit">

export type MonsterVitalSigRep = `${keyof VitalSigRep}Percent`;

export type MonsterSigRep = {
    vital: MonsterVitalSigRep;
    effect: MonsterEffect
}

export type PlayerSigRep = {
    vital: VitalSigRep;
    effect: PlayerEffect
}
