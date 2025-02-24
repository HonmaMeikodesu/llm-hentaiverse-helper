import {isUndefined} from "lodash";
import BattleParser from "../battle-parser/src/index.js";
import { MonsterStats, PlayerStats } from "../battle-parser/types/stats.js";
import {
    CommandPipeline,
    convertBattleActionToServerCommand,
} from "../command-io/src/index.js";
import LLMClient from "../command-io/src/llm/index.js";
import { BattleEndPayload, RoundEndPayload, State, TurnPayload } from "../command-io/src/pipeline/index.js";
import { LLMBattleAction } from "../command-io/types/index.js";
import { EVENT } from "../const.js";
import { commandBridge } from "./utils.js";

let currentHtmlContent = document.documentElement.outerHTML;

declare var battle_token: string;

function decideNextState(): RoundEndPayload | BattleEndPayload | TurnPayload {
    const monsterPane = document.querySelector("#pane_monster");
    if ([ "You have been defeated","You have run away" ].includes(monsterPane!.innerHTML)) {
        return {
            type: State.BATTLE_END,
            payload: {
                turnover: {
                    result: "defeat",
                    detail: monsterPane!.innerHTML
                }
            }
        };
    }
    if (["You are victorious"].includes(monsterPane!.innerHTML)) {
        return {
            type: State.ROUND_END,
            payload: {
                hasNextRound: true
            }
        }
    }
    if ([""].includes(monsterPane!.innerHTML)) {
        return {
            type: State.BATTLE_END,
            payload: {
                turnover: {
                    result: "victory",
                    detail: "",
                }
            }
        }
    }
    return {
        type: State.TURN,
        payload: {
            battleSigRep: undefined as any
        }
    }
}


async function main() {
    // playerStatus
    if (BattleParser.ifIsPlayerStatsPage(currentHtmlContent)) {
        const playerStatsReport =
            BattleParser.getPlayerStats(currentHtmlContent);
        chrome.runtime
            .sendMessage({
                type: EVENT.SAVE_PLAYER_STATS,
                payload: playerStatsReport,
            })
            .then(() => {
                window.alert(
                    "playerStats stored, now you can go ahead to start a battle"
                );
            });
    }
    // battlePage
    if (BattleParser.ifIsBattlePage(currentHtmlContent)) {
        const playerStats: PlayerStats = await chrome.runtime.sendMessage({
            type: EVENT.GET_PLAYER_STATS,
        });
        const battleParser = new BattleParser({
            initBattlePageContent: currentHtmlContent,
        });

        const battleSigRep = await battleParser.getBattleSigRep();

        let step = 0;

        const llmClient = new LLMClient(( window as any ).OPENAI_AI_KEY, {
            beforeInvoke: async (msgs) => { },
            afterInvoke: async (completions) => {
                if (step < 2) return;
                const resp = completions.choices[0];
                try {
                    const battleAction: LLMBattleAction = JSON.parse(
                        /\{[\s\S]*?.*?action.*?[\s\S]*?\}/.exec(
                            resp?.message?.content as string
                        )![0]
                    );
                    const serverCommand =
                        await convertBattleActionToServerCommand(
                            battleAction,
                            battleParser,
                            battle_token
                        );
                    commandBridge(serverCommand);
                } catch (e) { }
            },
            onInvokeError: async () => { },
        });

        const pipeline = new CommandPipeline({
            invokeLLM: llmClient.invoke,
        });

        await pipeline.step({
            type: State.BATTLE_BEGIN,
            payload: {
                playerStats,
            },
        });

        step = 1;

        const monstersStats: MonsterStats[] = ( await Promise.all(
            battleSigRep.monsters.map(async (monster) => {
                return await battleParser.getMonsterStats(monster.name);
            })
        ) ).filter(item => !isUndefined(item));

        await pipeline.step({
            type: State.ROUND_BEGIN,
            payload: {
                monstersStats
            },
        });

        step = 2;

        await pipeline.step({
            type: State.TURN,
            payload: {
                battleSigRep
            }
        });

        step = 3;

        let nextState = decideNextState();

        while (true) {
            // 浏览器环境下没有ROUND_END，需要强制刷新页面开始下一轮ROUND
            if (nextState.type === State.BATTLE_END) {
                await pipeline.step({
                    type: State.ROUND_END,
                    payload: {
                        hasNextRound: false
                    }
                });
                await pipeline.step(nextState);
                break;
            } else if (nextState.type === State.ROUND_END) {
                await pipeline.step(nextState);
                document.location += "";
                break;
            }
            currentHtmlContent = document.documentElement.outerHTML;
            battleParser.setBattlePage(currentHtmlContent);
            await pipeline.step({
                type: State.TURN,
                payload: {
                    battleSigRep: await battleParser.getBattleSigRep()
                }
            })

            step++;

            nextState = decideNextState();
        }
    }

    // TODO Pony Page
    if (!!document.querySelector("#riddlemaster")) {

    }

}

main();
