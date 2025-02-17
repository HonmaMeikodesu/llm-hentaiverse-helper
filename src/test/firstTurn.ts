import battleParser from "./fixtures/battleParser.js";
import { CommandPipeline } from "../command-io/src/index.js";
import { State } from "../command-io/src/pipeline/index.js";
import { MonsterStats } from "../battle-parser/types/stats.js";

const pipeline = new CommandPipeline([
    async (llmOutput) => {
        console.log(llmOutput);
    }
]);

async function testFirstTurn() {
    await pipeline.step({
        type: State.BATTLE_BEGIN,
        payload: {
            playerStats: await battleParser.getPlayerStats()
        }
    });

    const battleSigRep = await battleParser.getBattleSigRep();

    const monstersStats = await Promise.all(battleSigRep.monsters.map(monster => battleParser.getMonsterStats({ name: monster.name }))) as MonsterStats[];

    debugger;

    await pipeline.step({
        type: State.ROUND_BEGIN,
        payload: {
            monstersStats
        }
    });

    await pipeline.step({
        type: State.TURN,
        payload: {
            battleSigRep
        }
    })
}

testFirstTurn();