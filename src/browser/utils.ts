import {BattleCommand} from "../command-io/types/index.js";

function clickBtn(searchCondition: string) {
    const btn = document.querySelector(searchCondition) as HTMLDivElement;
    btn.click();
}

export function commandBridge(command: BattleCommand) {
    switch (command.mode) {
        case "attack":
            clickBtn("#ckey_attack");
            clickBtn(`mkey_${command.target}`);
            break;
        case "defend":
            clickBtn("#ckey_defend");
            break;
        case "focus":
            clickBtn("#ckey_focus");
            break;
        case "spirit":
            clickBtn("#ckey_spirit");
            break;
        case "magic":
            clickBtn(`#${command.skill}`);
            if (command.target > 0) {
                clickBtn(`mkey_${command.target}`);
            }
            break;
        case "items":
            clickBtn(`ikey_${command.skill}`);
    }
}
