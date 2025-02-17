import { EVENT, EVENT_PAYLOAD } from "../const.js";
import {
    getPlayerStatsFromStorage,
    savePlayerStatsToStorage,
} from "./storage.js";

chrome.runtime.onMessage.addListener(
    (params: EVENT_PAYLOAD, sender, sendResponse) => {
        switch (params?.type) {
            case EVENT.SAVE_PLAYER_STATS:
                savePlayerStatsToStorage(params?.payload).then(() => sendResponse(true));
                return true;
            case EVENT.GET_PLAYER_STATS:
                getPlayerStatsFromStorage().then((playerStats) => {
                    sendResponse(playerStats);
                });
                return true;
        }
    }
);
