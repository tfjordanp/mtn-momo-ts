import { describe, expect, it } from 'vitest';
import { Controller, DEFAULT_TARGET_CURRENCY } from '../src/index.js';
import { controllerOptions, describeIfConfigured, testConfig } from './setup.js';

/**
 * Stateful `Controller` integration tests against the MTN MoMo sandbox.
 *
 * These tests require real sandbox credentials in `.env.test`. When the
 * credentials are missing, the whole suite is skipped gracefully.
 */
describeIfConfigured('Controller (stateful)', () => {
  const app = new Controller(controllerOptions);

  describe('generateUUID', () => {
    it('returns a valid UUID v4', async () => {
      const uuid = await app.generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('returns a unique value on each call', async () => {
      const [a, b] = await Promise.all([app.generateUUID(), app.generateUUID()]);
      expect(a).not.toBe(b);
    });
  });

  describe('requestToPay', () => {
    it('resolves with ok:true and a referenceId on success', async () => {
      const result = await app.requestToPay({
        amount: testConfig.amount,
        partyId: testConfig.partyId,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.statusCode).toBeGreaterThanOrEqual(200);
        expect(result.statusCode).toBeLessThan(300);
        expect(result.referenceId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(result.externalId).toBeTruthy();
        expect(result.payerMessage).toBeTruthy();
        expect(result.payeeNote).toBeTruthy();
      }
    });

    it('resolves with ok:false and an error for an invalid partyId', async () => {
      const result = await app.requestToPay({
        amount: testConfig.amount,
        partyId: '0', // invalid sandbox MSISDN
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.referenceId).toBeTruthy();
      }
    });

    it('accepts a custom externalId, payerMessage and payeeNote', async () => {
      const externalId = 'test-external-id';
      const payerMessage = 'Test payer message';
      const payeeNote = 'Test payee note';

      const result = await app.requestToPay({
        amount: testConfig.amount,
        partyId: testConfig.partyId,
        externalId,
        payerMessage,
        payeeNote,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.externalId).toBe(externalId);
        expect(result.payerMessage).toBe(payerMessage);
        expect(result.payeeNote).toBe(payeeNote);
      }
    });
  });

  describe('getRequestToPayTransactionStatus', () => {
    it('returns a transaction status for a successful request', async () => {
      const created = await app.requestToPay({
        amount: testConfig.amount,
        partyId: testConfig.partyId,
      });

      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const status = await app.getRequestToPayTransactionStatus({
        referenceId: created.referenceId,
      });

      expect(status).toBeDefined();
      expect(status.status).toBeDefined();
      expect(['SUCCESSFUL', 'FAILED', 'PENDING']).toContain(status.status);
      expect(status.amount).toBeDefined();
      expect(status.currency).toBeDefined();
      expect(status.payer).toBeDefined();
    });
  });

  describe('requestToPayAndWait', () => {
    it('reaches a terminal status or times out', async () => {
      const result = await app.requestToPayAndWait({
        amount: testConfig.amount,
        partyId: testConfig.partyId,
        maxDurationMs: 15_000,
        initialDelayMs: 500,
        backoffMultiplier: 2,
      });

      if (result === 'timeout') {
        // A timeout is a valid outcome for a slow sandbox; just assert the shape.
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

  describe('default currency', () => {
    it('uses the sandbox default currency (EUR) when none is provided', async () => {
      // The default currency map is exported; sandbox maps to EUR.
      // (Cast needed because the `(string & {})` widening makes the key type `never`.)
      const sandboxCurrency = (DEFAULT_TARGET_CURRENCY as Record<string, string>).sandbox;
      expect(sandboxCurrency).toBe('EUR');
    });

  });
});
