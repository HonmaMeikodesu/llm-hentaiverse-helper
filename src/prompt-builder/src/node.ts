import BattleParser from "../../battle-parser/src/index.js";
import { BattleCommand } from "../../command-io/types/index.js";

async function startBattle() {

}

async function fetchBattleSigRep() {

    const battleParser = new BattleParser({
        initBattlePageContent: await ( await fetch("https://hentaiverse.org/?s=Battle") ).text()
    });

    return battleParser;
}

async function sendCommandToServer(command: BattleCommand) {
    return await fetch("https://hentaiverse.org/json", {
        method: "POST",
        body: JSON.stringify(command)
    })
}

async function pipeline(battleParser: BattleParser) {

}