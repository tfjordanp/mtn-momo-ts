import { describe, expect, it } from 'vitest';
import {
  getRequestToPayTransactionStatus,
  requestToPay,
  requestToPayAndWait,
} from '../src/index.js';
import { describeIfConfigured, testConfig } from './setup.js';

/**
 * Stateless helper integration tests against the MTN MoMo sandbox.
 *
 * These tests require real sandbox credentials in `.env.test`. When the
 * credentials are missing, the whole suite is skipped gracefully.
 */
describeIfConfigured('Stateless helpers', () => {
  // Base options shared by all stateless helpers (credentials + request fields).
  const baseOptions = {
    callbackHost: testConfig.callbackHost,
    userApiKey: testConfig.userApiKey,
    userId: testConfig.userId,
    primaryKey: testConfig.primaryKey,
    targetEnvironment: testConfig.targetEnvironment,
    amount: testConfig.amount,
    partyId: testConfig.partyId,
  };

  describe('requestToPay', () => {
    it('resolves with ok:true and a referenceId on success', async () => {
      const result = await requestToPay(baseOptions);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.statusCode).toBeGreaterThanOrEqual(200);
        expect(result.statusCode).toBeLessThan(300);
        expect(result.referenceId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
      }
    });

    it('resolves with ok:false and an error for an invalid partyId', async () => {
      const result = await requestToPay({
        ...baseOptions,
        partyId: '0000000000', // invalid sandbox MSISDN
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error.code).toBeDefined();
      }
    });
  });

  describe('getRequestToPayTransactionStatus', () => {
    it('returns a transaction status for a successful request', async () => {
      const created = await requestToPay(baseOptions);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const status = await getRequestToPayTransactionStatus({
        callbackHost: testConfig.callbackHost,
        userApiKey: testConfig.userApiKey,
        userId: testConfig.userId,
        primaryKey: testConfig.primaryKey,
        targetEnvironment: testConfig.targetEnvironment,
        referenceId: created.referenceId,
      });

      expect(status).toBeDefined();
      expect(status.status).toBeDefined();
      expect(['SUCCESSFUL', 'FAILED', 'PENDING']).toContain(status.status);
    });
  });

  describe('requestToPayAndWait', () => {
    it('reaches a terminal status or times out', async () => {
      const result = await requestToPayAndWait({
        ...baseOptions,
        maxDurationMs: 15_000,
        initialDelayMs: 500,
        backoffMultiplier: 2,
      });

      if (result === 'timeout') {
        expect(result).toBe('timeout');
      } else if ('ok' in result) {
        // Failure branch (ok:false)
        expect(result.ok).toBe(false);
        expect(result.error).toBeDefined();
      } else {
        // Transaction status branch
        expect(['SUCCESSFUL', 'FAILED']).toContain(result.status);
      }
    });
  });
});
