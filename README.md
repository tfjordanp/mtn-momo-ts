# MTN Momo Collections

A simple library for integrating with the MTN Momo Collections API.

- [Getting Your API Credentials](#getting-your-api-credentials)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Getting Your API Credentials

To use the MTN Momo Collections API, you need to generate your userId and userApiKey. Here's how you can generate them:

```bash
npx momo-sandbox --callback-host <callbackHost> --primary-key <primaryKey>
```

Replace **`<callbackHost>`** with the URL of your callback host and **`<primaryKey>`** with your actual MTN Mobile Money API primary or secondary key.

This command will generate a new user and display the **`userId`** and **`userApiKey`** in the console.

**Note:** "These credentials are specifically intended for use in the sandbox environment. In a production environment, you will be provided with the necessary credentials through the MTN OVA management dashboard after fulfilling the necessary KYC (Know Your Customer) requirements."

## Installation

Use the package manager [npm](https://www.npmjs.com/package/mtn-momo-ts) to install `mtn-momo-ts`.

```bash
npm install mtn-momo-ts --save
```

## Usage

This package ships with both **CommonJS** and **ESM** entry points, plus full **TypeScript** type definitions.

### Target Environments

The `targetEnvironment` option selects which MTN MoMo environment to target. It accepts any of the known values below (with IDE autocomplete) **or any custom string**:

- `'sandbox'`
- `'mtncameroon'`
- `'mtnuganda'`
- `'mtnghana'`
- `'mtnivorycoast'`
- `'mtnzambia'`
- `'mtnbenin'`
- `'mtnsouthafrica'`
- `'mtncongo'`
- `'mtnswaziland'`
- `'mtnguineaconakry'`
- `'mtnliberia'`

Each environment has a **default currency** (used when `currency` is omitted), defined in `DEFAULT_TARGET_CURRENCY`:

| Environment | Default currency |
| --- | --- |
| `sandbox` | `EUR` |
| `mtnuganda` | `UGX` |
| `mtnghana` | `GHS` |
| `mtnivorycoast` | `XOF` |
| `mtnzambia` | `ZMW` |
| `mtncameroon` | `XAF` |
| `mtnbenin` | `XOF` |
| `mtncongo` | `XAF` |
| `mtnswaziland` | `SZL` |
| `mtnguineaconakry` | `GNF` |
| `mtnsouthafrica` | `ZAR` |
| `mtnliberia` | `LRD` |


### Stateless helpers (recommended)

The package exposes stateless helpers that create a `Controller` internally, so you don't need to manage one yourself.

#### CommonJS

```js
const { requestToPay } = require('mtn-momo-ts');

requestToPay({
  callbackHost: '<callbackHost>',
  userApiKey: '<userApiKey>',
  userId: '<userId>',
  primaryKey: '<primaryKey>',
  targetEnvironment: 'mtncameroon',
  amount: '<amount>',
  partyIdType: 'MSISDN',
  partyId: '<partyId>',
  payerMessage: '<payerMessage>',
  payeeNote: '<payeeNote>'
})
  .then(({ ok, statusCode, referenceId }) => {
    console.log('OK:', ok);
    console.log('Status Code:', statusCode);
    console.log('Reference ID:', referenceId);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### ESM

```js
import { requestToPay } from 'mtn-momo-ts';

const { ok, statusCode, referenceId } = await requestToPay({
  callbackHost: '<callbackHost>',
  userApiKey: '<userApiKey>',
  userId: '<userId>',
  primaryKey: '<primaryKey>',
  targetEnvironment: 'mtncameroon',
  amount: '<amount>',
  partyIdType: 'MSISDN',
  partyId: '<partyId>',
  payerMessage: '<payerMessage>',
  payeeNote: '<payeeNote>'
});

console.log('OK:', ok);
console.log('Status Code:', statusCode);
console.log('Reference ID:', referenceId);
```

#### TypeScript

```ts
import { requestToPay, RequestToPayOptions } from 'mtn-momo-ts';

const options: RequestToPayOptions = {
  callbackHost: '<callbackHost>',
  userApiKey: '<userApiKey>',
  userId: '<userId>',
  primaryKey: '<primaryKey>',
  targetEnvironment: 'mtncameroon',
  amount: '<amount>',
  partyIdType: 'MSISDN',
  partyId: '<partyId>',
  payerMessage: '<payerMessage>',
  payeeNote: '<payeeNote>'
};

const { ok, statusCode, referenceId } = await requestToPay(options);
```

#### Waiting for a terminal status

Use `requestToPayAndWait` to initiate a request and poll until it reaches a terminal status (`SUCCESSFUL` or `FAILED`), using exponential backoff and a maximum polling duration:

```js
import { requestToPayAndWait } from 'mtn-momo-ts';

const result = await requestToPayAndWait({
  callbackHost: '<callbackHost>',
  userApiKey: '<userApiKey>',
  userId: '<userId>',
  primaryKey: '<primaryKey>',
  targetEnvironment: 'mtncameroon',
  amount: '<amount>',
  partyId: '<partyId>',
  maxDurationMs: 60_000,   // optional, defaults to 60s
  initialDelayMs: 1_000,   // optional, defaults to 1s
  backoffMultiplier: 2     // optional, defaults to 2
});

if ('status' in result) {
  console.log('Terminal status:', result.status);
} else {
  console.log('Request failed:', result.error);
}
```



## API Reference

### Stateless helpers

**`requestToPay(options)`**

Initiates a request to pay using the MTN Momo Collections API. Creates a `Controller` internally.

- **`options`**: An object containing the following properties:
  - **`callbackHost`**: *(optional)* The callback URL for receiving payment notifications.
  - **`userApiKey`**: Your MTN Momo user API key.
  - **`userId`**: Your MTN Momo user ID.
  - **`primaryKey`**: Your MTN Momo primary key.
  - **`targetEnvironment`**: The MTN MoMo target environment (e.g. `'sandbox'`, `'mtncameroon'`).
  - **`currency`**: *(optional)* The currency code. Defaults to the environment's default currency.
  - **`amount`**: The amount to be paid.
  - **`partyIdType`**: *(optional)* The type of the party ID (`'MSISDN'`, `'EMAIL'`, or `'PARTY_CODE'`). Defaults to `'MSISDN'`.
  - **`partyId`**: The party ID of the payer.
  - **`externalId`**: *(optional)* An ID generated by your system to uniquely identify the transaction.
  - **`payerMessage`**: *(optional)* A message that will be displayed to the payer.
  - **`payeeNote`**: *(optional)* A note that will be displayed to the payee.

Returns a promise that resolves to a `RequestToPayResponse`:

- **`ok`**: `true` on success, `false` on failure.
- **`statusCode`**: The HTTP status code from the API.
- **`referenceId`**: The reference ID generated for the transaction.
- **`error`**: *(only when `ok` is `false`)* An object with `code` and `message`.

**`getRequestToPayTransactionStatus(options)`**

Retrieves the transaction status for a given reference ID. Creates a `Controller` internally.

- **`options`**: An object containing the `ControllerOptions` (credentials) plus:
  - **`referenceId`**: The reference ID of the transaction.

Returns a promise that resolves to a `RequestToPayTransactionStatus` object (`amount`, `currency`, `financialTransactionId`, `externalId`, `payer`, `payerMessage`, `payeeNote`, `status`, `reason`).

**`requestToPayAndWait(options)`**

Initiates a request to pay and polls the transaction status until it reaches a terminal status (`SUCCESSFUL` or `FAILED`). Uses **exponential backoff**, a **maximum polling duration**, and **stops at a terminal status** (per MTN best practices).

- **`options`**: A `RequestToPayOptions` object plus:
  - **`maxDurationMs`**: *(optional)* Maximum polling duration in ms. Defaults to `60_000`.
  - **`initialDelayMs`**: *(optional)* Initial backoff delay in ms. Defaults to `1_000`.
  - **`backoffMultiplier`**: *(optional)* Backoff multiplier. Defaults to `2`.

Returns a promise that resolves to a `RequestToPayTransactionStatus` **or** a `RequestToPayFailure` (the `ok: false` branch of `RequestToPayResponse`). Throws if the maximum polling duration is exceeded.

### `Controller` class

The **`Controller`** class provides methods to interact with the MTN Momo Collections API.

Constructor

```js
const { Controller } = require('mtn-momo-ts');

const app = new Controller({
  callbackHost: '<callbackHost>',
  userApiKey: '<userApiKey>',
  userId: '<userId>',
  primaryKey: '<primaryKey>',
  targetEnvironment: 'mtncameroon',
  currency: 'XAF',
});
```

**`requestToPay({ amount, partyId, partyIdType?, externalId?, payerMessage?, payeeNote? })`**

Initiates a request to pay. The currency is taken from the `Controller` options.

Returns a promise that resolves to a `RequestToPayResponse` (see above).

**`getRequestToPayTransactionStatus({ referenceId })`**

Retrieves the transaction status for a given reference ID.

- **`referenceId`**: The reference ID of the transaction.

Returns a promise that resolves to a `RequestToPayTransactionStatus` object.

**`requestToPayAndWait({ amount, partyId, partyIdType?, externalId?, payerMessage?, payeeNote?, maxDurationMs?, initialDelayMs?, backoffMultiplier? })`**

Stateful version of the stateless `requestToPayAndWait` helper. Initiates a request to pay and polls the transaction status until it reaches a terminal status (`SUCCESSFUL` or `FAILED`), using exponential backoff and a maximum polling duration. The currency and credentials come from the `Controller` instance.

- **`maxDurationMs`**: *(optional)* Maximum polling duration in ms. Defaults to `60_000`.
- **`initialDelayMs`**: *(optional)* Initial backoff delay in ms. Defaults to `1_000`.
- **`backoffMultiplier`**: *(optional)* Backoff multiplier. Defaults to `2`.

Returns a promise that resolves to a `RequestToPayTransactionStatus` **or** a `RequestToPayFailure` (the `ok: false` branch of `RequestToPayResponse`). Throws if the maximum polling duration is exceeded.


### Types

- **`TargetEnvironment`**: Union of known MTN MoMo environments (or any custom string).
- **`ErrorCode`**: Union of MTN MoMo API error codes (or any custom string).
- **`PartyIdType`**: `'MSISDN' | 'EMAIL' | 'PARTY_CODE'`.
- **`ErrorReason`**: `{ code?: ErrorCode; message?: string }`.
- **`RequestToPayResponse`**: Discriminated union on `ok` (see above).
- **`RequestToPayTransactionStatus`**: The transaction status response body.
- **`DEFAULT_TARGET_CURRENCY`**: Map of environment → default currency.


## Development

This package is written in **TypeScript** and compiled to both **CommonJS** and **ESM** builds (plus auto-generated `.d.ts` type definitions) in the `dist/` directory.

```bash
# Install dependencies
npm install

# Build both CJS and ESM outputs into dist/
npm run build

# Clean the dist/ directory
npm run clean
```

The build runs `tsc` twice — once for CommonJS (`dist/cjs`) and once for ESM (`dist/esm`) — and writes a `dist/cjs/package.json` marking that directory as CommonJS so Node resolves both formats correctly.

## Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.


## License
This project is licensed under the MIT License.
