import { PlayerStats } from "../battle-parser/types/stats.js";

const playerStatsReportKey = "PlayerStats";

export async function savePlayerStatsToStorage(
	playerStatsReport: PlayerStats
) {
	await chrome.storage.local.set({
		[playerStatsReportKey]: playerStatsReport,
	});
}

export async function getPlayerStatsFromStorage() {
	return (await chrome.storage.local.get(playerStatsReportKey)[
		playerStatsReportKey
	]) as PlayerStats;
}
