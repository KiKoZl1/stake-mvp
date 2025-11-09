import type { BookEvent } from '../../game/typesBookEvent';

export type DebugBook = {
	id?: number | string;
	events: BookEvent[];
	payoutMultiplier?: number;
};

const simpleBoard = (rows: string[][]) =>
	rows.map((row) => row.map((name) => ({ name } as const)));

export const baseBooksSample: DebugBook[] = [
	{
		id: 1,
		payoutMultiplier: 0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: simpleBoard([
					['L2', 'L1', 'L4', 'H2', 'L1'],
					['H1', 'L5', 'L2', 'H3', 'L4'],
					['L3', 'L5', 'L3', 'H4', 'L4'],
					['H4', 'H3', 'L4', 'L5', 'L1'],
					['H3', 'L3', 'L3', 'H1', 'H1'],
				]),
				paddingPositions: [216, 205, 195, 16, 65],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
	},
	{
		id: 2,
		payoutMultiplier: 1.2,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: simpleBoard([
					['H2', 'H1', 'L2', 'L2', 'H1'],
					['L2', 'H4', 'S', 'L5', 'L3'],
					['H4', 'L4', 'H2', 'S', 'L4'],
					['L3', 'L4', 'H2', 'L1', 'L2'],
					['H3', 'S', 'L5', 'L2', 'H1'],
				]),
				paddingPositions: [49, 8, 212, 183, 167],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 1, 2],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{
				index: 2,
				type: 'freeSpinTrigger',
				totalFs: 8,
				positions: [
					{ reel: 1, row: 2 },
					{ reel: 2, row: 3 },
					{ reel: 4, row: 1 },
				],
			},
			{ index: 3, type: 'updateFreeSpin', amount: 0, total: 8 },
			{
				index: 4,
				type: 'reveal',
				board: simpleBoard([
					['H3', 'L4', 'L5', 'L1', 'L2'],
					['L5', 'H1', 'L2', 'H1', 'H4'],
					['L2', 'L1', 'S', 'L2', 'H3'],
					['L4', 'L4', 'H2', 'S', 'H2'],
					['L4', 'L5', 'L2', 'L5', 'L3'],
				]),
				paddingPositions: [140, 121, 101, 163, 38],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 1, 2],
			},
			{ index: 5, type: 'setTotalWin', amount: 0 },
			{ index: 6, type: 'updateFreeSpin', amount: 1, total: 8 },
			{
				index: 7,
				type: 'setWin',
				amount: 500_000,
				winLevel: 2,
			},
			{ index: 8, type: 'setTotalWin', amount: 500_000 },
			{ index: 9, type: 'freeSpinEnd', amount: 500_000, winLevel: 2 },
			{ index: 10, type: 'finalWin', amount: 500_000 },
		],
	},
];

export const bonusBooksSample: DebugBook[] = [
	{
		id: 'bonus-1',
		payoutMultiplier: 3.9,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: simpleBoard([
					['H2', 'S', 'L4', 'L2', 'H4'],
					['L5', 'L2', 'H4', 'S', 'L5'],
					['H1', 'S', 'H2', 'H2', 'L2'],
					['L4', 'H3', 'S', 'L5', 'L3'],
					['H4', 'L5', 'H1', 'L1', 'H2'],
				]),
				paddingPositions: [99, 55, 140, 64, 8],
				gameType: 'basegame',
				anticipation: [0, 1, 2, 0, 0],
			},
			{
				index: 1,
				type: 'freeSpinTrigger',
				totalFs: 8,
				positions: [
					{ reel: 0, row: 1 },
					{ reel: 1, row: 3 },
					{ reel: 2, row: 2 },
				],
			},
			{ index: 2, type: 'updateFreeSpin', amount: 0, total: 8 },
			{
				index: 3,
				type: 'reveal',
				board: simpleBoard([
					['H2', 'L1', 'L2', 'H3', 'H1'],
					['L2', 'H4', 'L4', 'L2', 'H4'],
					['L1', 'L4', 'H2', 'L3', 'L4'],
					['H3', 'L3', 'H3', 'H1', 'L3'],
					['L5', 'L2', 'H2', 'H4', 'L5'],
				]),
				paddingPositions: [42, 8, 96, 151, 77],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 4, type: 'setWin', amount: 720_000, winLevel: 3 },
			{ index: 5, type: 'setTotalWin', amount: 720_000 },
			{ index: 6, type: 'freeSpinEnd', amount: 720_000, winLevel: 3 },
			{ index: 7, type: 'finalWin', amount: 720_000 },
		],
	},
];