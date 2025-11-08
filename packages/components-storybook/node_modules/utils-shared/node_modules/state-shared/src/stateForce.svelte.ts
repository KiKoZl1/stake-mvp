import type { BaseBet } from 'utils-bet';

import type { BetModeKey } from './stateBet.svelte';

export const FORCE_TYPE_LIST = ['api', 'json', 'pastBets'] as const;
export type ForceTypeType = (typeof FORCE_TYPE_LIST)[number];
export type ForceResultSearch = {
	bookID?: number;
	kind?: string;
	symbol?: string;
	hasWild?: string;
	wildMult?: string;
	gameType?: string;
};

export const stateForce = $state({
	selectedPastBetIndex: 0,
	pastBets: [] as BaseBet[],
	force: false,
	forceType: 'api' as ForceTypeType,
	forceBetModeKey: 'BASE' as BetModeKey,
	forceSearch: {
		bookID: undefined,
		kind: 'Any',
		symbol: 'Any',
		hasWild: 'Any',
		wildMult: 'Any',
		gameType: 'Any',
	} as ForceResultSearch,
	forceJson: '',
});

export const stateForceDerived = {
	selectedPastBet: () => stateForce.pastBets?.[stateForce.selectedPastBetIndex],
};
