import request from 'request';
import { v4 as uuidv4 } from 'uuid';

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
}

/**
 * The response returned by {@link Controller.requestToPay}.
 */
export interface RequestToPayResponse {
  /** The response code from the API. */
  responseCode: string | number;
  /** The reference ID generated for the transaction. */
  referenceId: string;
}

/**
 * Provides methods to interact with the MTN Momo Collections API.
 */
export class Controller {
  private readonly callbackHost?: string;
  private readonly userApiKey: string;
  private readonly userId: string;
  private readonly primaryKey: string;

  constructor({ callbackHost, userApiKey, userId, primaryKey }: ControllerOptions) {
    this.callbackHost = callbackHost;
    this.userApiKey = userApiKey;
    this.userId = userId;
    this.primaryKey = primaryKey;
  }

  /**
   * Generates a new UUID v4.
   */
  async generateUUID(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const uuid = uuidv4();
        resolve(uuid);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initiates a request to pay.
   */
  async requestToPay(
    amount: string | number,
    currency: string,
    externalId: string,
    partyIdType: string,
    partyId: string,
    payerMessage: string,
    payeeNote: string
  ): Promise<RequestToPayResponse> {
    const token = await this.getToken();
    const referenceId = await this.generateUUID();
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        url: 'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
        headers: {
          'Content-Type': 'application/json',
          'X-Reference-Id': referenceId,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': this.primaryKey,
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          externalId: externalId,
          payer: { partyIdType: partyIdType, partyId: partyId },
          payerMessage: payerMessage,
          payeeNote: payeeNote,
        }),
      };

      request(options, (error, response) => {
        if (error) {
          reject(error);
        } else {
          const requestToPay = response.statusCode;
          resolve({ responseCode: requestToPay, referenceId: referenceId });
        }
      });
    });
  }

  private getToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      const authorizationBasic = Buffer.from(this.userId + ':' + this.userApiKey).toString('base64');

      const options = {
        method: 'POST',
        url: 'https://sandbox.momodeveloper.mtn.com/collection/token/',
        headers: {
          'Ocp-Apim-Subscription-Key': this.primaryKey,
          Authorization: 'Basic ' + authorizationBasic,
        },
      };

      request(options, (error, response) => {
        if (error) {
          reject(error);
        } else {
          const token = JSON.parse(response.body).access_token;
          if (token) {
            resolve(token);
          }
        }
      });
    });
  }

  /**
   * Retrieves the transaction status for a given reference ID.
   */
  async getTransactionStatus(referenceId: string): Promise<Record<string, unknown>> {
    const token = await this.getToken();
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        url: `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${referenceId}`,
        headers: {
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': this.primaryKey,
          Authorization: 'Bearer ' + token,
        },
      };
      request(options, (error, response) => {
        if (error) {
          reject(error);
        } else {
          const transactionStatus = JSON.parse(response.body);
          resolve(transactionStatus);
        }
      });
    });
  }
}
