import BattleParser from "../battle-parser/src/index.js";
import { PlayerStats } from "../battle-parser/types/stats.js";
import { CommandPipeline } from "../command-io/src/index.js";
import LLMClient from "../command-io/src/llm/index.js";
import { EVENT } from "../const.js";

const currentHtmlContent = document.documentElement.outerHTML;

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

        const llmClient = new LLMClient({
            beforeInvoke: async (msgs) => {},
            afterInvoke: async (completions) => {},
            onInvokeError: async () => {},
        });

        const pipeline = new CommandPipeline({
            invokeLLM: llmClient.invoke,
        });
    }
}
