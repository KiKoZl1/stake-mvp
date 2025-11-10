import type { BetType } from 'rgs-requests-remote';
import * as remote from 'rgs-requests-remote';
import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { debugPlay, isDebug } from './debug';

type AuthenticateOptions = Parameters<typeof remote.requestAuthenticate>[0];
type BetOptions = Parameters<typeof remote.requestBet>[0];
type EndRoundOptions = Parameters<typeof remote.requestEndRound>[0];
type EndEventOptions = Parameters<typeof remote.requestEndEvent>[0];
type ForceResultOptions = Parameters<typeof remote.requestForceResult>[0];

const DEFAULT_BET_LEVELS = [
  100_000,
  200_000,
  400_000,
  600_000,
  800_000,
  1_000_000,
  2_000_000,
  5_000_000,
  10_000_000,
];

const sanitizeString = (value?: string | null) => value?.trim() ?? '';
const sanitizeUpper = (value?: string | null) => sanitizeString(value).toUpperCase();
const shouldUseDebug = (rgsUrl?: string) => isDebug() || !sanitizeString(rgsUrl);

const ensureSessionID = (sessionID: string | undefined, debugMode: boolean) => {
  const sanitized = sanitizeString(sessionID);
  if (sanitized && sanitized !== 'debug-session') return sanitized;
  if (debugMode) return sanitized || 'debug-session';
  throw new Error('Missing required query param "sessionID".');
};

const ensureRgsUrl = (rgsUrl: string | undefined, debugMode: boolean) => {
  const sanitized = sanitizeString(rgsUrl);
  if (sanitized) return sanitized;
  if (debugMode) return '';
  throw new Error('Missing required query param "rgs_url".');
};

const ensureLanguage = (language?: string) => sanitizeString(language) || 'en';
const ensureCurrency = (currency?: string) => sanitizeUpper(currency) || 'USD';
const ensureMode = (mode?: string) => sanitizeUpper(mode) || 'BASE';

const ensureAmount = (amount?: number) => {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
    throw new Error('Bet amount must be a number greater than or equal to 0.');
  }
  return amount;
};

const ensureEventIndex = (eventIndex?: number): number => {
  if (eventIndex === undefined || !Number.isInteger(eventIndex) || Number(eventIndex) < 0) {
    throw new Error('eventIndex must be a non-negative integer.');
  }
  return eventIndex;
};

const createMockAuthenticateResponse = () => ({
  balance: {
    amount: 100_000_000,
    currency: 'USD',
  },
  config: {
    minBet: DEFAULT_BET_LEVELS[0],
    maxBet: DEFAULT_BET_LEVELS[DEFAULT_BET_LEVELS.length - 1],
    stepBet: 100_000,
    defaultBetLevel: DEFAULT_BET_LEVELS[5],
    betLevels: DEFAULT_BET_LEVELS,
    jurisdiction: {
      socialCasino: false,
      disabledFullscreen: false,
      disabledTurbo: false,
      disabledSuperTurbo: false,
      disabledAutoplay: false,
      disabledSlamstop: false,
      disabledSpacebar: false,
      disabledBuyFeature: false,
      displayNetPosition: false,
      displayRTP: false,
      displaySessionTimer: false,
      minimumRoundDuration: 0,
    },
  },
  round: null,
});

export const requestAuthenticate = async (options: AuthenticateOptions) => {
  const debugMode = shouldUseDebug(options.rgsUrl);
  const sessionID = ensureSessionID(options.sessionID, debugMode);
  const language = ensureLanguage(options.language);

  if (!debugMode) {
    const rgsUrl = ensureRgsUrl(options.rgsUrl, false);
    return remote.requestAuthenticate({ ...options, sessionID, language, rgsUrl });
  }

  return createMockAuthenticateResponse();
};

export const requestEndRound = async (options: EndRoundOptions) => {
  const debugMode = shouldUseDebug(options.rgsUrl);
  const sessionID = ensureSessionID(options.sessionID, debugMode);

  if (!debugMode) {
    const rgsUrl = ensureRgsUrl(options.rgsUrl, false);
    return remote.requestEndRound({ ...options, sessionID, rgsUrl });
  }

  return { ok: true };
};

export const requestEndEvent = async (options: EndEventOptions) => {
  const debugMode = shouldUseDebug(options.rgsUrl);
  const sessionID = ensureSessionID(options.sessionID, debugMode);
  const eventIndex = ensureEventIndex(options.eventIndex);

  if (!debugMode) {
    const rgsUrl = ensureRgsUrl(options.rgsUrl, false);
    return remote.requestEndEvent({ ...options, sessionID, eventIndex, rgsUrl });
  }

  return { ok: true };
};

export const requestForceResult = async (options: ForceResultOptions) => {
  if (!shouldUseDebug(options.rgsUrl)) {
    const rgsUrl = ensureRgsUrl(options.rgsUrl, false);
    const mode = ensureMode(options.mode);
    return remote.requestForceResult({ ...options, mode, rgsUrl });
  }

  return { round: null };
};

export const requestBet = async (options: BetOptions) => {
  const debugMode = shouldUseDebug(options.rgsUrl);
  const sessionID = ensureSessionID(options.sessionID, debugMode);
  const currency = ensureCurrency(options.currency);
  const mode = ensureMode(options.mode);
  const amount = ensureAmount(options.amount);

  if (!debugMode) {
    const rgsUrl = ensureRgsUrl(options.rgsUrl, false);
    return remote.requestBet({ ...options, sessionID, currency, mode, amount, rgsUrl });
  }

  const { round } = await debugPlay();

  const mockRound: BetType<any> = {
    amount: amount * API_AMOUNT_MULTIPLIER,
    payout: 0,
    payoutMultiplier: 0,
    active: false,
    state: round.events ?? [],
    mode,
    event: undefined,
  };

  return { round: mockRound };
};

export type { BetType } from 'rgs-requests-remote';
