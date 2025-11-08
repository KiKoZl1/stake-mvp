import { PUBLIC_CHROMATIC } from 'envs';
import { stateUrlDerived } from 'state-shared';
import { requestEndEvent } from 'rgs-requests';

import type { BaseBookEvent } from './types';

export function recordBookEvent<TBookEvent extends BaseBookEvent>({
	bookEvent,
}: {
	bookEvent: TBookEvent;
}) {
	try {
		if (PUBLIC_CHROMATIC) {
			console.log('storybook mock request end-event:', bookEvent.index, bookEvent.type);
			return;
		}

		requestEndEvent({
			eventIndex: bookEvent.index,
			rgsUrl: stateUrlDerived.rgsUrl(),
			sessionID: stateUrlDerived.sessionID(),
		});
	} catch (error) {
		console.error(error);
	}
}

export function checkIsMultipleRevealEvents<TBookEvent extends BaseBookEvent>({
	bookEvents,
}: {
	bookEvents: TBookEvent[];
}) {
	const revealEventCount = bookEvents.filter((bookEvent) => bookEvent.type === 'reveal').length;
	const isMultipleReveals = revealEventCount > 1;
	return isMultipleReveals;
}
