const { makeRequest } = require('mtn-momo-ts');

makeRequest({
  callbackHost: "<callbackHost>",
  userApiKey: "<userApiKey>",
  userId: "<userId>",
  primaryKey: "<primaryKey>",
  targetEnvironment: "mtncameroon",
  currency: "XAF",
  amount: "<amount>",
  externalId: "<externalId>",
  partyIdType: "MSISDN",
  partyId: "<partyId>",
  payerMessage: "<payerMessage>",
  payeeNote: "<payeeNote>"
})
  .then(({ response, status }) => {
    console.log("Response:", response);
    console.log("Transaction Status:", status);
  })
  .catch(error => {
    console.error("Error:", error);
  });
