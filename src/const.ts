export enum EVENT {
	SAVE_PLAYER_STATS,
    GET_PLAYER_STATS
};

export type EVENT_PAYLOAD = {
	type: EVENT;
	payload: any;
}
