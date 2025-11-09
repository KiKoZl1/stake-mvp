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

const shouldUseDebug = (rgsUrl?: string) => isDebug() || !rgsUrl;

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
  if (!shouldUseDebug(options.rgsUrl)) {
    return remote.requestAuthenticate(options);
  }

  return createMockAuthenticateResponse();
};

export const requestEndRound = async (options: EndRoundOptions) => {
  if (!shouldUseDebug(options.rgsUrl)) {
    return remote.requestEndRound(options);
  }

  return { ok: true };
};

export const requestEndEvent = async (options: EndEventOptions) => {
  if (!shouldUseDebug(options.rgsUrl)) {
    return remote.requestEndEvent(options);
  }

  return { ok: true };
};

export const requestForceResult = async (options: ForceResultOptions) => {
  if (!shouldUseDebug(options.rgsUrl)) {
    return remote.requestForceResult(options);
  }

  return { round: null };
};

export const requestBet = async (options: BetOptions) => {
  if (!shouldUseDebug(options.rgsUrl)) {
    return remote.requestBet(options);
  }

  const { round } = await debugPlay();

  const mockRound: BetType<any> = {
    id: round.id ?? 'debug-round',
    amount: options.amount * API_AMOUNT_MULTIPLIER,
    payout: 0,
    payoutMultiplier: 0,
    active: false,
    state: round.events ?? [],
    mode: options.mode ?? 'BASE',
    event: null,
  };

  return { round: mockRound };
};

export * from 'rgs-requests-remote';
