import BattleParser from "../../battle-parser/src/index.js";
import { readFile } from "fs/promises";
import { resolve } from "path";

console.log(__dirname);

const battlePageContent = await readFile(resolve(__dirname, "../docs/research/startBattle.html"), "utf-8");

export default new BattleParser({ initBattlePageContent: battlePageContent });
