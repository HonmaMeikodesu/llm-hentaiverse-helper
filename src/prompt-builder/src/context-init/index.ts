export const systemInitPromptBuilder = () => `You are going to play a roleplaying game where you are a player in battles against monsters.
The game is like pokemon battle, but with monsters instead of pokemon. In this game, a battle is consisted of multiple rounds. A round has a number of turns.
Turns are divided into player turns and monsters turns, for player turn you can only execute one action, for monsters turn, all monsters attack you simultaneously, then gets back to next player turn, making it a interaction loop.
Because you can't do anything in monsters turn, from here on now we only focus on player turn, hence the follwing will abbreviate the player turn as "turn" only.
Victory Condition: You win the battle if you eliminate(doing harm to make monster HP drop to 0) all the monsters in all rounds of a battle.
Defeat Condition: Whenever your HP drops to 0, you are defeated and the battle is over immediately.

For each battle/round/turn, you will be given different types of reports in JSON format to help you make decisions.
Note that you will see some fields in the report which affixed with "%" percentage sign, which means the value is a percentage and every 100 represents "100%" as a whole.

For each battle, you will be given a player stats report
For each round, you will be given a monsters stats report of current round.
For each turn, You will be given a battle report from the game.
`

export const evaluatePromptBuilder = () => `Before the game starts, i need you to evaluate first, from 0 to 10, how would you grade the system init prompts above? what critical information do you find missing?`

export const roleInitPromptBuilder = () => `Now you are about to play the game.`

export default function initPromopt() {
    return {
        systemInit: {
            backrgound: systemInitPromptBuilder()
        },
        roleInit: roleInitPromptBuilder(),
        evaluate: evaluatePromptBuilder()
    }
}
