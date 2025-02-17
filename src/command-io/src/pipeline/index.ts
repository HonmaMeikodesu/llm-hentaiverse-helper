import { OpenAI } from "openai";
import { MonsterStats, PlayerStats } from "../../../battle-parser/types/stats.js";
import { BattleSigRep } from "../../../battle-parser/src/index.js";
import initPromopt from "../../../prompt-builder/src/context-init/index.js";
import { buildBattlePrompt, buildBattleStartPrompt } from "../../../prompt-builder/src/battle/index.js";
import LLMClient from "../llm/index.js";
import { buildRoundPrompt, buildRoundStartPrompt } from "../../../prompt-builder/src/battle-round/index.js";
import { buildTurnPrompt } from "../../../prompt-builder/src/battle-turn/index.js";

export enum State {
    SYSTEM_INIT,
    BATTLE_BEGIN,
    ROUND_BEGIN,
    TURN,
    ROUND_END,
    BATTLE_END,
} 

export type BattlePayload = {
    type: State.BATTLE_BEGIN;
    payload: {
        playerStats: PlayerStats;
    }
}

export type RoundPayload = {
    type: State.ROUND_BEGIN;
    payload: {
        monstersStats: MonsterStats[];
    }
}

export type TurnPayload = {
    type: State.TURN;
    payload: {
        battleSigRep: BattleSigRep;
    }
}

export type RoundEndPayload = {
    type: State.ROUND_END;
    payload: {
        hasNextRound: boolean;
    }
};

export type BattleEndPayload = {
    type: State.BATTLE_END;
    payload: {
        turnover: {
            result: "victory" | "defeat",
            detail: any
        }
    }
}

type Payload = BattlePayload | RoundPayload | TurnPayload | RoundEndPayload | BattleEndPayload;

export default class CommandPipeline {

    private LLMClient: LLMClient;

    private systemInitContext: OpenAI.ChatCompletionMessageParam[];

    private battleContext: OpenAI.ChatCompletionMessageParam[];

    private battlePayloadCache: BattlePayload["payload"]

    private roundContext: OpenAI.ChatCompletionMessageParam[];

    private roundPayloadCache: RoundPayload["payload"];

    private currentState: State;
    
    private disposed = false;

    private sideEffects: Array<(llmOutput: string) => Promise<void>> = [];

    constructor(sideEffects: typeof this.sideEffects) {
        this.sideEffects = sideEffects;
        this.init();
    }

    private init() {
        const { systemInit, roleInit } = initPromopt();

        this.systemInitContext = [
            {
                role: "system",
                content: systemInit
            },
            {
                role: "user",
                content: roleInit
            }
        ];

        this.LLMClient = new LLMClient();

        this.currentState = State.SYSTEM_INIT;
    }

    buildBattleContext(playerStats: PlayerStats, isBegin = false) {
        if (isBegin) {
            this.battleContext = [{
                role: "user",
                content: buildBattleStartPrompt(playerStats)
            }];
        } else {
            this.battleContext = [{
                role: "user",
                content: buildBattlePrompt(playerStats)
            }];
        }
        this.battlePayloadCache = {
            playerStats
        };
    }

    buildRoundContext(monstersStats: MonsterStats[], isBegin = false) {
        if (isBegin) {
            this.roundContext = [{
                role: "user",
                content: buildRoundStartPrompt(monstersStats)
            }];
        } else {
            this.roundContext = [{
                role: "user",
                content: buildRoundPrompt(monstersStats)
            }];
        }
        this.roundPayloadCache = {
            monstersStats
        }
    }

    stateTransitionCheck(next: Payload) {
        switch (next.type) {
            case State.BATTLE_BEGIN:
                if (this.currentState !== State.SYSTEM_INIT) throw new Error(`Invalid state transition! ${this.currentState} -> ${next.type}`)
                    break;
            case State.ROUND_BEGIN:
                if (![State.BATTLE_BEGIN, State.ROUND_END].includes(this.currentState)) throw new Error(`Invalid state transition! ${this.currentState} -> ${next.type}`)
                    break;
            case State.TURN:
                if (![State.TURN, State.ROUND_BEGIN].includes(this.currentState)) throw new Error(`Invalid state transition! ${this.currentState} -> ${next.type}`)
                    break;
            case State.ROUND_END:
                if (this.currentState !== State.TURN) throw new Error(`Invalid state transition! ${this.currentState} -> ${next.type}`)
                    break;
            case State.BATTLE_END:
                if (this.currentState !== State.ROUND_END) throw new Error(`Invalid state transition! ${this.currentState} -> ${next.type}`)
                    break;
            default:
                // @ts-expect-error never
                throw new Error(`Unknown state ${next.type}`)
        }
    }

    async triggerSideEffects(turnPrompt: OpenAI.ChatCompletionMessageParam) {
        if (this.currentState !== State.TURN) {
            throw new Error(`Invalid side effects triggering! current state: ${this.currentState}`);
        }
        const complet = await this.LLMClient.invoke(
            [
                ...this.systemInitContext,
                ...this.battleContext,
                ...this.roundContext,
                turnPrompt
            ]
        )
        await Promise.all(this.sideEffects.map(sideEffect => sideEffect(complet.content!)));
    }

    /**
     * BATTLE_BEGIN -> ROUND_BEGIN -> TURN -> TURN -> ROUND_END -> ROUND_BEGIN -> TURN -> TURN -> ROUND_END -> BATTLE_END
     */
    async step(next: Payload) {
        if (this.disposed) {
            throw new Error("CommandPipeline has been disposed");
        }
        this.stateTransitionCheck(next);
        switch(next.type) {
            case State.BATTLE_BEGIN:
                this.buildBattleContext(next.payload.playerStats, true)
                this.currentState = next.type;
                break;
            case State.ROUND_BEGIN:
                this.buildBattleContext(this.battlePayloadCache.playerStats, this.currentState === State.BATTLE_BEGIN);
                this.buildRoundContext(next.payload.monstersStats, true)
                this.currentState = next.type;
                break;
            case State.TURN:
                this.buildRoundContext(this.roundPayloadCache.monstersStats, this.currentState === State.ROUND_BEGIN)
                this.currentState = next.type;
                await this.triggerSideEffects({ role: "user", content: buildTurnPrompt(next.payload.battleSigRep) });
                break;
            case State.BATTLE_END:
                this.disposed = true;
            case State.ROUND_END:
                this.currentState = next.type;
        }
    }
}