import { locales } from 'config-lingui';

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

const getBrowserUrl = () => {
	if (typeof window === 'undefined' || typeof window.location === 'undefined') {
		return new URL('http://localhost');
	}

	return new URL(window.location.href);
};

const getUrlSearchParam = (key: Key) => getBrowserUrl().searchParams.get(key);

const lang = () =>
	getUrlSearchParam('lang') === 'br' ? 'pt' : (getUrlSearchParam('lang') as Language) || 'en';
const sessionID = () => getUrlSearchParam('sessionID') || 'debug-session';
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
