import { describe, it } from 'vitest';

import type { ControllerOptions, TargetEnvironment } from '../src/index.js';

/**
 * Shared test configuration loaded from the gitignored `.env.test` file.
 *
 * The values are read from `process.env` (populated by `vitest.config.ts`
 * via `dotenv`). If the required credentials are missing, the integration
 * tests skip gracefully instead of failing.
 */
export interface TestConfig {
  /** The callback URL for receiving payment notifications. */
  callbackHost?: string;
  /** Your MTN Momo user API key. */
  userApiKey: string;
  /** Your MTN Momo user ID. */
  userId: string;
  /** Your MTN Momo primary key. */
  primaryKey: string;
  /** The MTN MoMo target environment (always `'sandbox'` for tests). */
  targetEnvironment: TargetEnvironment;
  /** A sandbox payer MSISDN to use as the `partyId`. */
  partyId: string;
  /** The amount to request in tests. */
  amount: string | number;
}

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

/**
 * The parsed test configuration. `targetEnvironment` is forced to `'sandbox'`
 * so tests never accidentally hit a production environment.
 */
export const testConfig: TestConfig = {
  callbackHost: readEnv('MOMO_CALLBACK_HOST') || undefined,
  userApiKey: readEnv('MOMO_USER_API_KEY'),
  userId: readEnv('MOMO_USER_ID'),
  primaryKey: readEnv('MOMO_PRIMARY_KEY'),
  targetEnvironment: 'sandbox',
  partyId: readEnv('MOMO_PARTY_ID'),
  amount: readEnv('MOMO_AMOUNT') || 100,
};

/**
 * True when all required credentials are present in `.env.test`.
 */
export const credentialsConfigured: boolean =
  Boolean(testConfig.userApiKey) &&
  Boolean(testConfig.userId) &&
  Boolean(testConfig.primaryKey) &&
  Boolean(testConfig.partyId);

/**
 * A `ControllerOptions`-shaped object (without the request-specific fields)
 * that can be spread into both the stateful `Controller` constructor and the
 * stateless helpers.
 */
export const controllerOptions: ControllerOptions = {
  callbackHost: testConfig.callbackHost,
  userApiKey: testConfig.userApiKey,
  userId: testConfig.userId,
  primaryKey: testConfig.primaryKey,
  targetEnvironment: testConfig.targetEnvironment,
};

/**
 * Wraps `describe` so the whole suite is skipped (with a clear message) when
 * the sandbox credentials are not configured.
 */
export function describeIfConfigured(name: string, fn: () => void): void {
  if (!credentialsConfigured) {
    describe.skip(name, () => {
      it('is skipped because .env.test is not configured', () => {
        // Intentionally empty — the skip message above explains why.
      });
    });
    return;
  }
  describe(name, fn);
}
