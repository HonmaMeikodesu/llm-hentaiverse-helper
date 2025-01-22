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

    private battleContext: { user: OpenAI.ChatCompletionMessageParam[], asistant: OpenAI.ChatCompletionMessageParam  };

    private battlePayloadCache: BattlePayload["payload"]

    private roundContext: { user: OpenAI.ChatCompletionMessageParam[], asistant: OpenAI.ChatCompletionMessageParam  };

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

    buildBattlePrompt(playerStats: PlayerStats, isBegin = false) {
        let userPrompt: OpenAI.ChatCompletionMessageParam[] = [];
        if (isBegin) {
            userPrompt = [{
                role: "user",
                content: buildBattleStartPrompt(playerStats)
            }];
        } else {
            userPrompt = [{
                role: "user",
                content: buildBattlePrompt(playerStats)
            }];
        }
        this.battlePayloadCache = {
            playerStats
        };
        return userPrompt;
    }

    buildRoundPrompt(monstersStats: MonsterStats[], isBegin = false) {
        let userPrompt: OpenAI.ChatCompletionMessageParam[] = [];
        if (isBegin) {
            userPrompt = [{
                role: "user",
                content: buildRoundStartPrompt(monstersStats)
            }];
        } else {
            userPrompt = [{
                role: "user",
                content: buildRoundPrompt(monstersStats)
            }];
        }

        this.roundPayloadCache = {
            monstersStats
        }

        return userPrompt;
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
                ...this.battleContext.user,
                this.battleContext.asistant,
                ...this.roundContext.user,
                this.roundContext.asistant,
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
                const battleUserPrompt = this.buildBattlePrompt(next.payload.playerStats, true)
                const battleComplet = await this.LLMClient.invoke(
                    [
                        ...this.systemInitContext,
                        ...battleUserPrompt
                    ]
                );
                this.battleContext = {
                    user: battleUserPrompt,
                    asistant: {
                        role: "assistant",
                        content: battleComplet.content
                    }
                }
                this.currentState = next.type;
                break;
            case State.ROUND_BEGIN:
                const roundUserPrompt = this.buildRoundPrompt(next.payload.monstersStats, true)
                const roundComplet = await this.LLMClient.invoke(
                    [
                        ...this.systemInitContext,
                        ...this.battleContext.user,
                        this.battleContext.asistant,
                        ...roundUserPrompt
                    ]
                );
                this.roundContext = {
                    user: roundUserPrompt,
                    asistant: {
                        role: "assistant",
                        content: roundComplet.content
                    }
                }
                this.currentState = next.type;
                break;
            case State.TURN:
                if (this.currentState === State.TURN) {
                    this.battleContext.user = this.buildBattlePrompt(this.battlePayloadCache.playerStats, false);
                    this.roundContext.user = this.buildRoundPrompt(this.roundPayloadCache.monstersStats, false);
                }
                this.currentState = next.type;
                await this.triggerSideEffects({ role: "user", content: buildTurnPrompt(next.payload.battleSigRep) });
                break;
            case State.BATTLE_END:
                this.disposed = true;
            case State.ROUND_END:
                this.currentState = next.type;
                this.battleContext.user = this.buildBattlePrompt(this.battlePayloadCache.playerStats, false);
        }
    }
}