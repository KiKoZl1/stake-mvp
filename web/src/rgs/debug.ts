import { baseBooksSample, bonusBooksSample, type DebugBook } from './books/samples';
import type { RoundPayload } from './types';
import type { BookEvent } from '../game/typesBookEvent';
import config from '../game/config';

type DebugScenario = 'base' | 'bonus';

const query = new URLSearchParams(location.search);
const loweredParams = new Map<string, string>();
query.forEach((value, key) => loweredParams.set(key.toLowerCase(), value));
const qs = (name: string) => loweredParams.get(name.toLowerCase()) ?? null;

const parseBooleanParam = (name: string) => {
	const raw = qs(name);
	if (!raw) return false;
	const normalized = raw.trim().toLowerCase();
	return normalized === '1' || normalized === 'true';
};

const parseNumberParam = (name: string) => {
	const raw = qs(name);
	if (!raw) return undefined;
	const value = Number(raw);
	return Number.isFinite(value) ? value : undefined;
};

const cloneDeep = <T>(value: T): T => {
	const structuredCloneFn = (globalThis as typeof globalThis & {
		structuredClone?: <TValue>(payload: TValue) => TValue;
	}).structuredClone;

	if (typeof structuredCloneFn === 'function') {
		return structuredCloneFn(value);
	}

	return JSON.parse(JSON.stringify(value)) as T;
};

const scenarioAliases: Record<string, DebugScenario | 'random'> = {
	bonus: 'bonus',
	fs: 'bonus',
	freespin: 'bonus',
	freegame: 'bonus',
	random: 'random',
	default: 'base',
};

const scenarioBooks: Record<DebugScenario, DebugBook[]> = {
	base: baseBooksSample,
	bonus: bonusBooksSample,
};

const pickRandomScenario = (): DebugScenario => (Math.random() < 0.5 ? 'base' : 'bonus');

const normaliseScenario = (value?: string): DebugScenario => {
	if (!value) return pickRandomScenario();
	const key = value.toLowerCase();
	const alias = scenarioAliases[key];
	if (alias === 'random') return pickRandomScenario();
	return (alias as DebugScenario) ?? pickRandomScenario();
};

const pickBook = (
	books: DebugBook[],
	opts: { bookId?: number; bookIndex?: number; random?: boolean; preferRandom?: boolean },
) => {
	if (!books.length) return { id: 'debug-empty', events: [] };

	if (typeof opts.bookId === 'number') {
		const byId = books.find((book) => {
			const numericId = typeof book.id === 'number' ? book.id : Number(book.id);
			return Number.isFinite(numericId) ? numericId === opts.bookId : book.id === opts.bookId;
		});
		if (byId) return byId;
	}

	if (typeof opts.bookIndex === 'number' && Number.isFinite(opts.bookIndex)) {
		const normalizedIndex = Math.trunc(opts.bookIndex);
		const index = ((normalizedIndex % books.length) + books.length) % books.length;
		return books[index];
	}

	const shouldRandomize =
		Boolean(opts.random) || (opts.preferRandom && opts.bookId == null && opts.bookIndex == null);
	if (shouldRandomize) {
		const randomIndex = Math.floor(Math.random() * books.length);
		return books[randomIndex];
	}

	return books[0];
};

const clampReelIndex = (value?: number) => {
	if (value == null || Number.isNaN(value)) return undefined;
	if (!Number.isInteger(value)) return undefined;
	if (value >= 0 && value < config.numReels) return value;
	if (value > 0 && value <= config.numReels) return value - 1;
	return undefined;
};

const ensureAnticipationLength = (current?: number[]) => {
	const next = current ? [...current] : [];
	while (next.length < config.numReels) {
		next.push(0);
	}
	return next;
};

const applyForceScatter = (events: BookEvent[], forceScatterReel?: number) => {
	if (forceScatterReel == null) return events;

	return events.map((bookEvent) => {
		if (bookEvent.type !== 'reveal' || !bookEvent.board?.[forceScatterReel]) {
			return bookEvent;
		}

		const board = bookEvent.board.map((column) => column.map((symbol) => ({ ...symbol })));
		const targetColumn = board[forceScatterReel];
		if (!targetColumn || targetColumn.length === 0) {
			return bookEvent;
		}

		const existingScatterIndex = targetColumn.findIndex(
			(symbol) => symbol.name === 'S' || symbol.scatter,
		);
		const rowIndex = existingScatterIndex >= 0 ? existingScatterIndex : 0;
		targetColumn[rowIndex] = { ...targetColumn[rowIndex], name: 'S', scatter: true };

		const anticipation = ensureAnticipationLength(bookEvent.anticipation);
		anticipation[forceScatterReel] = Math.max(anticipation[forceScatterReel] ?? 0, 1);

		return {
			...bookEvent,
			board,
			anticipation,
		};
	});
};

export function isDebug() {
	const modeParam = qs('mode');
	if (modeParam) {
		return modeParam.toLowerCase() === 'debug';
	}
	return parseBooleanParam('debug');
}

export async function debugPlay(): Promise<{ round: RoundPayload }> {
	const scenario = normaliseScenario(qs('scenario') ?? undefined);
	const books = scenarioBooks[scenario];
	const bookId = parseNumberParam('bookId');
	const bookIndex = parseNumberParam('bookIndex');
	const randomFlag = parseBooleanParam('random');
	const chosenBook = pickBook(books, {
		bookId,
		bookIndex,
		random: randomFlag,
		preferRandom: scenario === 'base',
	});

	const events = cloneDeep<BookEvent[]>(chosenBook.events ?? []);
	const forceScatterReel = clampReelIndex(parseNumberParam('forceScatter'));
	const mutatedEvents = applyForceScatter(events, forceScatterReel);

	return {
		round: {
			id: `debug-${scenario}-${chosenBook.id ?? '0'}`,
			events: mutatedEvents,
		},
	};
}
