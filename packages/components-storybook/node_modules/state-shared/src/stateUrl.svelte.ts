import { locales } from 'config-lingui';
import { page } from '$app/state';

export type Language = (typeof locales)[number];

export type Key =
	| 'sessionID'
	| 'rgs_url'
	| 'lang'
	| 'currency'
	| 'device'
	| 'social'
	| 'demo'
	| 'force'
;

const getUrlSearchParam = (key: Key) => page.url.searchParams.get(key);

const lang = () =>
	getUrlSearchParam('lang') === 'br' ? 'pt' : (getUrlSearchParam('lang') as Language) || 'en';
const sessionID = () => getUrlSearchParam('sessionID') || '';
const rgsUrl = () => getUrlSearchParam('rgs_url') || '';
const force = () => getUrlSearchParam('force') === 'true';
const social = () => getUrlSearchParam('social') === 'true';

export const stateUrlDerived = {
	lang,
	sessionID,
	rgsUrl,
	force,
	social,
};
