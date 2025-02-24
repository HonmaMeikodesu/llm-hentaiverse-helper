import battleParser from "./fixtures/battleParser.js";
import {
    CommandPipeline,
    convertBattleActionToServerCommand,
} from "../command-io/src/index.js";
import { State } from "../command-io/src/pipeline/index.js";
import { MonsterStats } from "../battle-parser/types/stats.js";
import LLMClient from "../command-io/src/llm/index.js";
import { LLMBattleAction } from "../command-io/types/index.js";
import { readFile } from "fs/promises";
import { resolve } from "path";
import BattleParser from "../battle-parser/src/index.js";

let step = 0;

const llmClient = new LLMClient(( process.env as any ).OPENAI_AI_KEY, {
    beforeInvoke: async (msgs) => {
        console.log(msgs);
        debugger;
    },
    afterInvoke: async (completions) => {
        if (step < 2) return;
        const resp = completions.choices[0];
        try {
            const battleAction: LLMBattleAction = JSON.parse(
                /\{[\s\S]*?.*?action.*?[\s\S]*?\}/.exec(
                    resp?.message?.content as string
                )![0]
            );
            const serverCommand = await convertBattleActionToServerCommand(
                battleAction,
                battleParser,
                ""
            );
            console.log(serverCommand);
        } catch (e) {
            console.error(e);
        }
    },
    onInvokeError: async () => {},
});

const pipeline = new CommandPipeline({ invokeLLM: llmClient.invoke });

async function testFirstTurn() {
    const statusPageContent = await readFile(
        resolve(__dirname, "../docs/research/status.html"),
        "utf-8"
    );
    await pipeline.step({
        type: State.BATTLE_BEGIN,
        payload: {
            playerStats: await BattleParser.getPlayerStats(statusPageContent),
        },
    });
    step++;

    const battleSigRep = await battleParser.getBattleSigRep();

    const monstersStats = (
        (await Promise.all(
            battleSigRep.monsters.map((monster) =>
                battleParser.getMonsterStats(monster.name)
            )
        )) as MonsterStats[]
    ).filter(Boolean);

    await pipeline.step({
        type: State.ROUND_BEGIN,
        payload: {
            monstersStats,
        },
    });

    step ++;

    await pipeline.step({
        type: State.TURN,
        payload: {
            battleSigRep,
        },
    });
}

testFirstTurn();
