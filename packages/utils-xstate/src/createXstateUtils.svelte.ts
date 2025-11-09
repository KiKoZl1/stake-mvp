import { matchesState, type StateValue } from 'xstate';

import {
	STATE_RENDERING,
	STATE_IDLE,
	STATE_BET,
	STATE_AUTOBET,
	STATE_RESUME_BET,
	STATE_FORCE_RESULT,
} from './constants';

export const createXstate = () => {
	const matchesXstate = (state: string) => matchesState(state, stateXstate.value);

	const stateXstate = $state({
		value: '' as StateValue,
	});

	const stateXstateDerived = {
		matchesXstate,
		isRendering: () => matchesXstate(STATE_RENDERING),
		isIdle: () => matchesXstate(STATE_IDLE),
		isBetting: () => matchesXstate(STATE_BET),
		isAutoBetting: () => matchesXstate(STATE_AUTOBET),
		isResumingBet: () => matchesXstate(STATE_RESUME_BET),
		isForcingResult: () => matchesXstate(STATE_FORCE_RESULT),
		isPlaying: () => !matchesXstate(STATE_RENDERING) && !matchesXstate(STATE_IDLE),
	};

	return {
		stateXstate,
		stateXstateDerived,
	};
};
