import { baseBooksSample, bonusBooksSample, type DebugBook } from './books/samples';
import type { RoundPayload } from './types';

type DebugScenario = 'base' | 'bonus';

const query = new URLSearchParams(location.search);
const qs = (name: string) => query.get(name);

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
	opts: { bookId?: string; bookIndex?: string; random?: boolean },
) => {
	if (!books.length) return { id: 'debug-empty', events: [] };

	const bookId = opts.bookId ? Number(opts.bookId) : undefined;
	if (typeof bookId === 'number' && !Number.isNaN(bookId)) {
		const byId = books.find((book) => Number(book.id) === bookId);
		if (byId) return byId;
	}

	const bookIndex = opts.bookIndex ? Number(opts.bookIndex) : undefined;
	if (typeof bookIndex === 'number' && Number.isFinite(bookIndex)) {
		const index = ((bookIndex % books.length) + books.length) % books.length;
		return books[index];
	}

	if (opts.random) {
		const randomIndex = Math.floor(Math.random() * books.length);
		return books[randomIndex];
	}

	return books[0];
};

export function isDebug() {
	return qs('debug') === '1';
}

export async function debugPlay(): Promise<{ round: RoundPayload }> {
	const scenario = normaliseScenario(qs('scenario') ?? undefined);
	const books = scenarioBooks[scenario];
	const randomFlag = qs('random') === '1';
	const chosenBook = pickBook(books, {
		bookId: qs('bookId') ?? undefined,
		bookIndex: qs('bookIndex') ?? undefined,
		random: randomFlag,
	});

	return {
		round: {
			id: `debug-${scenario}-${chosenBook.id ?? '0'}`,
			events: chosenBook.events ?? [],
		},
	};
}