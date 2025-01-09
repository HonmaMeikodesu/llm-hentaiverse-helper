type BattleCommand = {
    type: "battle",
    method: string,
    token: string,
    mode: string,
    target: number,
    skill: number | string
}

type BattleResponse = {
    panel_effects: string;
    pane_quickbar: string;
    pane_vitals: string;
    table_skills: string;
    table_magic: string;
    pane_monster: string;
    textlog: Array<string>;
    healthflash: boolean;
    exp: number
}