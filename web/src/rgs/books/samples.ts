import baseBooksData from '../../stories/data/base_books';
import bonusBooksData from '../../stories/data/bonus_books';
import type { BookEvent } from '../../game/typesBookEvent';

export type DebugBook = {
	id?: number | string;
	events: BookEvent[];
	payoutMultiplier?: number;
};

const normalizeBooks = (books: any[]): DebugBook[] =>
	books.map((book, index) => ({
		id: book.id ?? index + 1,
		payoutMultiplier: book.payoutMultiplier,
		events: (book.events ?? []) as BookEvent[],
	}));

export const baseBooksSample: DebugBook[] = normalizeBooks(baseBooksData as any[]);
export const bonusBooksSample: DebugBook[] = normalizeBooks(bonusBooksData as any[]);

const scenarioBooks: Record<'base' | 'bonus', DebugBook[]> = {
	base: baseBooksSample,
	bonus: bonusBooksSample,
};

const pickBook = (
	books: DebugBook[],
	opts: { bookId?: string; bookIndex?: string; random?: boolean; preferRandom?: boolean },
) => {
	const { random = false, preferRandom = false } = opts;
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

	const shouldRandom = random || (preferRandom && opts.bookId == null && opts.bookIndex == null);
	if (shouldRandom) {
		const randomIndex = Math.floor(Math.random() * books.length);
		return books[randomIndex];
	}

	return books[0];
};

const scenarioAliases: Record<string, 'base' | 'bonus' | 'random'> = {
	bonus: 'bonus',
	fs: 'bonus',
	freespin: 'bonus',
	freegame: 'bonus',
	random: 'random',
	default: 'base',
};

const scenarioBooksMap: Record<'base' | 'bonus', DebugBook[]> = scenarioBooks;

const pickRandomScenario = (): 'base' | 'bonus' => (Math.random() < 0.5 ? 'base' : 'bonus');

const normaliseScenario = (value?: string): 'base' | 'bonus' => {
	if (!value) return pickRandomScenario();
	const key = value.toLowerCase();
	const alias = scenarioAliases[key];
	if (alias === 'random') return pickRandomScenario();
	return (alias as 'base' | 'bonus') ?? pickRandomScenario();
};

const query = new URLSearchParams(location.search);
const qs = (name: string) => query.get(name);

export function isDebug() {
	return qs('debug') === '1';
}

export async function debugPlay(): Promise<{ round: { id?: string; events: BookEvent[] } }> {
	const scenario = normaliseScenario(qs('scenario') ?? undefined);
	const books = scenarioBooksMap[scenario];
	const randomFlag = qs('random') === '1';
	const chosenBook = pickBook(books, {
		bookId: qs('bookId') ?? undefined,
		bookIndex: qs('bookIndex') ?? undefined,
		random: randomFlag,
		preferRandom: scenario === 'base',
	});

	return {
		round: {
			id: `debug-${scenario}-${chosenBook.id ?? '0'}`,
			events: chosenBook.events ?? [],
		},
	};
}
