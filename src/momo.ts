import axios from 'axios';
import { CurrencyCode } from 'currency-codes-ts/dist/types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * The MTN MoMo target environment. Use one of the known values for
 * autocomplete, or any custom string for a custom environment.
 */
export type TargetEnvironment =
  | 'sandbox'
  | 'mtncameroon'
  | 'mtnuganda'
  | 'mtnghana'
  | 'mtnivorycoast'
  | 'mtnzambia'
  | 'mtnbenin'
  | 'mtnsouthafrica'
  | 'mtncongo'
  | 'mtnswaziland'
  | 'mtnguineaconakry'
  | 'mtnliberia'
  | (string & {});    //taken from https://momodevelopercommunity.mtn.com/how-to-59/momo-api-production-configuration-101

/**
 * Options for constructing a {@link Controller} instance.
 */
export interface ControllerOptions {
  /** The callback URL for receiving payment notifications. */
  callbackHost?: string;
  /** Your MTN Momo user API key. */
  userApiKey: string;
  /** Your MTN Momo user ID. */
  userId: string;
  /** Your MTN Momo primary key. */
  primaryKey: string;
  /** The MTN MoMo target environment (e.g. `'sandbox'`, `'mtncameroon'`). */
  targetEnvironment: TargetEnvironment;
  /** The currency code for the transactions. */
  currency?: CurrencyCode | (string & {});
}

export type ErrorCode = 
  | 'PAYER_NOT_FOUND'
  | 'NOT_ALLOWED'
  | 'NOT_ALLOWED_TARGET_ENVIRONMENT'
  | 'INVALID_CALLBACK_URL_HOST'
  | 'INVALID_CURRENCY'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_PROCESSING_ERROR'
  | 'NOT_ENOUGH_FUNDS'
  | 'PAYER_LIMIT_REACHED'
  | 'PAYEE_NOT_ALLOWED_TO_RECEIVE'
  | 'PAYMENT_NOT_APPROVED'
  | 'RESOURCE_NOT_FOUND'
  | 'APPROVAL_REJECTED'
  | 'EXPIRED'
  | 'TRANSACTION_CANCELED'
  | 'TRANSACTION_CANCELED.'
  | 'RESOURCE_ALREADY_EXIST'
  | 'TRANSACTION_NOT_COMPLETED'
  | 'TRANSACTION_NOT_FOUND'
  | 'INFORMATIONAL_SCOPE_INSTRUCTION'
  | 'MISSING_SCOPE_INSTRUCTION'
  | 'MORE_THAN_ONE_FINANCIAL_SCOPE_NOT_SUPPORTED'
  | 'UNSUPPORTED_SCOPE_COMBINATION'
  | 'CONSENT_MISMATCH'
  | 'UNSUPPORTED_SCOPE'
  | 'NOT_FOUND'
  | (string & {});    //taken from https://momoapi.mtn.com/API-collections#api=collection&operation=requesttopay-referenceId-GET (includes duplicated "TRANSACTION_CANCELED" from sandbox API, alias is "TRANSACTION_CANCELED.")



export type PartyIdType = 'MSISDN' | 'EMAIL' | 'PARTY_CODE';

export type ErrorReason = { code?: ErrorCode; message?: string };

export type RequestToPayResponse = {
  statusCode: number;
  referenceId: string;
  externalId: string;
  payerMessage: string;
  payeeNote: string;
} & (
  | { ok: true }
  | { ok: false; error: ErrorReason }
);

/**
 * The failure branch of {@link RequestToPayResponse} (i.e. `ok: false`).
 */
export type RequestToPayFailure = Extract<RequestToPayResponse, { ok: false }>;


export interface RequestToPayTransactionStatus {
  amount?: string;
  currency?: string;
  financialTransactionId?: string;
  externalId?: string;
  payer:  {
    partyIdType?: PartyIdType;
    partyId?: string;
  };
  payerMessage?: string;
  payeeNote?: string;
  status?: 'SUCCESSFUL' | 'FAILED' | 'PENDING' | (string & {});    //taken from https://momodevelopercommunity.mtn.com/product-updates/momo-api-error-response-enrichment-186
  reason?: ErrorReason;
}

export const DEFAULT_TARGET_CURRENCY: Record<   //infered from https://momodevelopercommunity.mtn.com/how-to-59/momo-api-production-configuration-101
  Exclude<TargetEnvironment, (string & {})>,
  CurrencyCode
> = {
  sandbox: 'EUR',
  mtnuganda: 'UGX',
  mtnghana: 'GHS',
  mtnivorycoast: 'XOF',
  mtnzambia: 'ZMW',
  mtncameroon: 'XAF',
  mtnbenin: 'XOF',
  mtncongo: 'XAF',
  mtnswaziland: 'SZL',
  mtnguineaconakry: 'GNF',
  mtnsouthafrica: 'ZAR',
  mtnliberia: 'LRD',
};

function defaultCurrencyForEnvironment(
  targetEnvironment: TargetEnvironment,
): CurrencyCode | (string & {}) {
  return DEFAULT_TARGET_CURRENCY[targetEnvironment as Exclude<TargetEnvironment, (string & {})>] || 'EUR';
}


export interface RequestToPayOptions{
  amount: string | number;
  partyId: string;
  partyIdType?: PartyIdType;
  externalId?: string;
  payerMessage?: string;
  payeeNote?: string;
}

export interface GetRequestToPayTransactionStatusOptions{
  referenceId: string;
}

export interface RequestToPayAndWaitOptions extends RequestToPayOptions {
  /** Maximum polling duration in milliseconds. Defaults to `60_000`. */
  maxDurationMs?: number;
  /** Initial backoff delay in milliseconds. Defaults to `1_000`. */
  initialDelayMs?: number;
  /** Backoff multiplier applied after each poll. Defaults to `2`. */
  backoffMultiplier?: number;
}


/**
 * Provides methods to interact with the MTN Momo Collections API.
 */
export class Controller {
  private readonly callbackHost?: string;
  private readonly userApiKey: string;
  private readonly userId: string;
  private readonly primaryKey: string;
  private readonly targetEnvironment: ControllerOptions['targetEnvironment'];
  private readonly currency: Exclude<ControllerOptions['currency'], undefined>;

  constructor({ callbackHost, userApiKey, userId, primaryKey, targetEnvironment, currency }: ControllerOptions) {
    this.callbackHost = callbackHost;
    this.userApiKey = userApiKey;
    this.userId = userId;
    this.primaryKey = primaryKey;
    this.targetEnvironment = targetEnvironment;
    this.currency = currency || defaultCurrencyForEnvironment(targetEnvironment);
  }

  /**
   * The base URL for the configured target environment.
   */
  private get baseUrl(): string {   //taken fromhttps://momodevelopercommunity.mtn.com/how-to-59/momo-api-production-configuration-101
    return this.targetEnvironment === 'sandbox'
      ? `https://sandbox.momodeveloper.mtn.com`
      : 'https://proxy.momoapi.mtn.com';
  }

  /**
   * Generates a new UUID v4.
   */
  async generateUUID(): Promise<string> {
    return uuidv4();
  }

  /**
   * Initiates a request to pay.
   */
  async requestToPay({
    amount,
    partyId,
    partyIdType = 'MSISDN',
    externalId,
    payerMessage,
    payeeNote,
  }: RequestToPayOptions): Promise<RequestToPayResponse> {
    const token = await this.getToken();
    const referenceId = await this.generateUUID();
    const MESSAGE = `Payment request for ${amount} ${this.currency}, Reference ID: ${referenceId}`;

    externalId = externalId || (await this.generateUUID());
    payerMessage = payerMessage || MESSAGE;
    payeeNote = payeeNote || MESSAGE;

    const response = await axios.post(
      `${this.baseUrl}/collection/v1_0/requesttopay`,
      {
        amount,
        currency: this.currency,
        externalId,
        payer: { partyIdType, partyId },
        payerMessage,
        payeeNote,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Reference-Id': referenceId,
          'X-Target-Environment': this.targetEnvironment,
          'Ocp-Apim-Subscription-Key': this.primaryKey,
          Authorization: 'Bearer ' + token,
        },
      }
    );

    const subresult = {
      statusCode: response.status, referenceId, externalId, payerMessage, payeeNote
    };

    if (response.status.toString().startsWith('2')) {
      return { 'ok': true, ...subresult };
    }
    else{
      return { 'ok': false, error: { code: response.data.code, message: response.data.message }, ...subresult };
    }
  }

  private async getToken(): Promise<string> {
    const authorizationBasic = Buffer.from(this.userId + ':' + this.userApiKey).toString('base64');

    const response = await axios.post(
      `${this.baseUrl}/collection/token/`,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.primaryKey,
          Authorization: 'Basic ' + authorizationBasic,
        },
      }
    );

    return response.data.access_token;
  }

  /**
   * Retrieves the transaction status for a given reference ID.
   */
  async getRequestToPayTransactionStatus({ referenceId }: GetRequestToPayTransactionStatusOptions): Promise<RequestToPayTransactionStatus> {
    const token = await this.getToken();

    const response = await axios.get(
      `${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          'X-Target-Environment': this.targetEnvironment,
          'Ocp-Apim-Subscription-Key': this.primaryKey,
          Authorization: 'Bearer ' + token,
        },
      }
    );

    return response.data;
  }

  /**
   * Initiates a request to pay and polls the transaction status until it
   * reaches a terminal status (`SUCCESSFUL` or `FAILED`).
   *
   * Polling follows the MTN best practices:
   * - Uses exponential backoff between polls.
   * - Stops after a maximum polling duration.
   * - Stops as soon as a terminal status is reached.
   *
   * If the initial request to pay fails (`ok: false`), the failure response is
   * returned directly. If the maximum polling duration is exceeded before a
   * terminal status is reached, `'timeout'` is returned.
   */
  async requestToPayAndWait({

    amount,
    partyId,
    partyIdType,
    externalId,
    payerMessage,
    payeeNote,
    maxDurationMs = 60_000,
    initialDelayMs = 1_000,
    backoffMultiplier = 2,
  }: RequestToPayAndWaitOptions): Promise<RequestToPayTransactionStatus | RequestToPayFailure | 'timeout'> {
    const response = await this.requestToPay({ amount, partyId, partyIdType, externalId, payerMessage, payeeNote });
    if (!response.ok) {
      return response;
    }

    const referenceId = response.referenceId;
    const startTime = Date.now();
    let delay = initialDelayMs;

    await sleep(delay);  //initial delay before first poll

    while (Date.now() - startTime < maxDurationMs) {
      const status = await this.getRequestToPayTransactionStatus({ referenceId });
      if (status.status === 'SUCCESSFUL' || status.status === 'FAILED') {
        return status;
      }
      await sleep(delay);
      delay *= backoffMultiplier;
    }

    return 'timeout';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
