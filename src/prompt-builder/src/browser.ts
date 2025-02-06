import BattleParser from "../../battle-parser/src/index.js";
import { CommandPipeline } from "../../command-io/src/index.js";
import { BattleCommand, LLMBattleAction } from "../../command-io/types/index.js";
import { convertBattleActionToServerCommand } from "../../command-io/utils/index.js";

declare global {
    interface Window {
        battle_token: string
    }
}

async function fetchBattleSigRep() {


}

async function sendCommandToServer(command: BattleCommand) {
    return await fetch("https://hentaiverse.org/json", {
        method: "POST",
        body: JSON.stringify(command)
    })
}

async function pipeline(battleParser: BattleParser) {
    const battleSigRep = await fetchBattleSigRep();

    const pipeline = new CommandPipeline([
        async (llmOutput) => {
            const directive: LLMBattleAction = JSON.parse(/\{[\s\S]*?.*?action.*?[\s\S]*?\}/.exec(llmOutput)![0]);
            const command = await convertBattleActionToServerCommand(directive, battleParser, window.battle_token);

            await sendCommandToServer(command);
        }
    ]);

}
