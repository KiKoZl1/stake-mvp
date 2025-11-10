import config from './config';
import type { GameType, RawSymbol } from './types';

type ConfigPaddingSymbol = Partial<RawSymbol> & { name: string };

const toRawSymbol = (symbol: ConfigPaddingSymbol): RawSymbol => ({
	...symbol,
	name: symbol.name as RawSymbol['name'],
});

export const getPaddingBoard = (gameType: GameType): RawSymbol[][] => {
	const board = config.paddingReels?.[gameType];

	if (!board) {
		return [];
	}

	return board.map((reel) => reel.map(toRawSymbol));
};
