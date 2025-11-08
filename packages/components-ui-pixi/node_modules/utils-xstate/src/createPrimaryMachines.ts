import { fromPromise } from 'xstate';

import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet, stateUrlDerived, stateForce, stateForceDerived, stateModal } from 'state-shared';
import { requestBet, requestForceResult, requestEndRound } from 'rgs-requests';

import type { BaseBet } from './types';

const handleRequestBet = async ({ onError }: { onError: () => void }) => {
	try {
		const data = await requestBet({
			rgsUrl: stateUrlDerived.rgsUrl(),
			sessionID: stateUrlDerived.sessionID(),
			currency: stateBet.currency,
			mode: stateBet.activeBetModeKey,
			amount: stateBet.betAmount,
		});

		if (data?.error) {
			throw data;
		}

		if (data?.round?.state && data?.round?.state?.length > 0) {
			stateBet.wageredBetAmount = stateBet.betAmount;

			return data;
		} else {
			throw {
				error: 'Empty state in data.round',
				message: JSON.stringify({ data }),
			};
		}
	} catch (error) {
		onError();
		stateBet.autoSpinsCounter = 0;
		stateModal.modal = { name: 'error', error };
		console.error(error);
		throw error;
	}
};

const handleRequestEndRound = async () => {
	try {
		const data = await requestEndRound({
			sessionID: stateUrlDerived.sessionID(),
			rgsUrl: stateUrlDerived.rgsUrl(),
		});

		if (data?.error) {
			throw data;
		}

		if (data?.balance?.amount !== undefined) {
			return data;
		} else {
			throw {
				error: 'Empty amount in data.balance',
				message: JSON.stringify({ data }),
			};
		}
	} catch (error) {
		if (!stateForce.force) stateModal.modal = { name: 'error', error };
		console.error(error);
	}
};

const handleUpdateBalance = ({ balanceAmountFromApi }: { balanceAmountFromApi: number }) => {
	stateBet.balanceAmount = balanceAmountFromApi / API_AMOUNT_MULTIPLIER;
};

type Options<TBet extends BaseBet> = {
	onResumeGameActive: (lastBetData: TBet) => TBet;
	onResumeGameInactive: (lastBetData: TBet) => void;
	onNewGameStart: () => Promise<void> | undefined;
	onNewGameError: () => any;
	onPlayGame: (bet: TBet) => Promise<void>;
	checkIsBonusGame: (bet: TBet) => boolean;
};

function createPrimaryMachines<TBet extends BaseBet>(options: Options<TBet>) {
	const {
		onResumeGameActive,
		onResumeGameInactive,
		onNewGameStart,
		onNewGameError,
		onPlayGame,
		checkIsBonusGame,
	} = options;

	let balanceAmountFromApiHolder: null | number = null;

	const BET_TYPE_METHODS_MAP = {
		noWin: {
			newGame: async () => undefined,
			endGame: async () => undefined,
		},
		singleRoundWin: {
			newGame: async () => {
				const endRoundData = await handleRequestEndRound();
				if (endRoundData?.balance) {
					balanceAmountFromApiHolder = endRoundData.balance.amount;
				}
			},
			endGame: async () => {
				if (balanceAmountFromApiHolder !== null) {
					handleUpdateBalance({ balanceAmountFromApi: balanceAmountFromApiHolder });
					balanceAmountFromApiHolder = null;
				}
			},
		},
		bonusWin: {
			newGame: async () => undefined,
			endGame: async () => {
				const data = await handleRequestEndRound();
				if (data?.balance) {
					handleUpdateBalance({ balanceAmountFromApi: data.balance.amount });
					balanceAmountFromApiHolder = null;
				}
			},
		},
	} as const;

	const getBetType: (args: { bet: TBet }) => keyof typeof BET_TYPE_METHODS_MAP = ({ bet }) => {
		const isBonusGame = checkIsBonusGame(bet);

		if (bet.active === true) {
			if (isBonusGame) return 'bonusWin';
		}

		if (bet.payoutMultiplier && bet.payoutMultiplier > 0) {
			if (isBonusGame) return 'bonusWin';
			return 'singleRoundWin';
		}

		return 'noWin';
	};

	// newGame
	const newGame = fromPromise(async () => {
		await onNewGameStart();

		const data = await handleRequestBet({ onError: onNewGameError });

		if (data) {
			if (data.balance) {
				handleUpdateBalance({ balanceAmountFromApi: data.balance.amount });
			}

			const bet = data.round as TBet;
			const betType = getBetType({ bet });
			await BET_TYPE_METHODS_MAP[betType].newGame();

			return { bet };
		}

		return { bet: null };
	});

	// resumeGame
	const resumeGame = fromPromise(async () => {
		const lastBetData = stateBet.lastBet as TBet;

		if (lastBetData && lastBetData.active) {
			// Optional chaining doesn't work here with build-node. 🤷‍♂️
			stateBet.lastBet = null;

			//End Round resumed active bet
			const bet = lastBetData as TBet;
			const betType = getBetType({ bet });
			await BET_TYPE_METHODS_MAP[betType].newGame();

			return { bet: onResumeGameActive(lastBetData), rawBet: lastBetData };
		}

		if (lastBetData && lastBetData.state && lastBetData.state.length > 0) {
			onResumeGameInactive(lastBetData);
		}

		throw new Error('inactive Bet');
	});

	// playGame
	const playGame = fromPromise<void, { bet: TBet | null }>(async ({ input }) => {
		if (stateForce.force && stateForce.forceType !== 'pastBets' && input.bet) {
			stateForce.pastBets = [...stateForce.pastBets, input.bet];
		}
		if (input.bet) await onPlayGame(input.bet); // context.bet is hydrated from newGame
	});

	// endGame
	const endGame = fromPromise<void, { bet: TBet | null; rawBet: TBet | null }>(
		async ({ input }) => {
			const targetBet = input.rawBet || input.bet;
			if (targetBet) {
				const betType = getBetType({ bet: targetBet });
				await BET_TYPE_METHODS_MAP[betType].endGame();
			}
		},
	);

	// forceGame
	const forceGame = fromPromise(async () => {
		await onNewGameStart();

		try {
			const forceWithApi = async () => {
				return await requestForceResult({
					rgsUrl: stateUrlDerived.rgsUrl(),
					mode: stateForce.forceBetModeKey.toUpperCase(),
					search: {
						bookID:
							stateForce.forceSearch.bookID === undefined
								? undefined
								: Number(stateForce.forceSearch.bookID),
						kind:
							stateForce.forceSearch.kind === 'Any'
								? undefined
								: Number(stateForce.forceSearch.kind),
						symbol:
							stateForce.forceSearch.symbol === 'Any' ? undefined : stateForce.forceSearch.symbol,
						hasWild:
							stateForce.forceSearch.hasWild === 'Any'
								? undefined
								: stateForce.forceSearch.hasWild === 'True',
						wildMult:
							stateForce.forceSearch.wildMult === 'Any'
								? undefined
								: Number(stateForce.forceSearch.wildMult),
						gameType:
							stateForce.forceSearch.gameType === 'Any'
								? undefined
								: stateForce.forceSearch.gameType,
					},
				});
			};

			const forceWithJson = () => {
				const forceJsonObject = JSON.parse(stateForce.forceJson);

				return {
					round: {
						mode: stateForce.forceBetModeKey.toUpperCase(),
						payoutMultiplier: 2,
						state: forceJsonObject.events,
					},
					error: null,
					balance: null,
				};
			};

			const forceWithPastBets = () => {
				return {
					round: stateForceDerived.selectedPastBet(),
					error: null,
					balance: null,
				};
			};

			const FORCE_FUNCTION_MAP = {
				api: forceWithApi,
				json: forceWithJson,
				pastBets: forceWithPastBets,
			};

			const data = await FORCE_FUNCTION_MAP[stateForce.forceType]();

			if (data?.error) {
				throw data;
			}

			if (data?.round?.state && data?.round?.state?.length > 0) {
				if (data?.balance?.amount !== undefined) {
					handleUpdateBalance({ balanceAmountFromApi: data.balance.amount });
				}

				stateBet.wageredBetAmount = stateBet.betAmount;
				if (data.round.mode) {
					stateBet.activeBetModeKey = data.round.mode;
				}

				return { bet: data.round as TBet, rawBet: null };
			} else {
				throw {
					error: 'Empty state in data.round',
					message: JSON.stringify({ data }),
				};
			}
		} catch (error) {
			onNewGameError();
			stateBet.autoSpinsCounter = 0;
			stateModal.modal = { name: 'error', error };
			console.error(error);
			throw error;
		}
	});

	return {
		newGame,
		playGame,
		endGame,
		resumeGame,
		forceGame,
	};
}

export { createPrimaryMachines };
