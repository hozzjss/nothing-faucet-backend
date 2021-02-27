// const { cvToString, intCV } = require("@blockstack/stacks-transactions");
const { principalCV } = require("@blockstack/stacks-transactions/lib/clarity/types/principalCV");
const { AnchorMode, PostConditionMode } = require("@blockstack/stacks-transactions/lib/constants");
const { StacksMainnet }  = require('@stacks/network')
const {
  uintCV,
  makeContractCall,
  broadcastTransaction,
  makeContractFungiblePostCondition,
  getNonce
}  = require('@stacks/transactions');
require('dotenv').config();
const BN = require("bn.js");

const app = require('express')();
app.use(require('cors')());
app.use(require('body-parser').json());
const myAddress = process.env.STX_ADDRESS;
let nonce = 3;
const fetch = require('node-fetch')
app.post('/faucet', async (req, res) => {
  const {address} = req.body;
  
  const tx = await makeContractCall({
    contractAddress: 'SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ',
    contractName: 'micro-nthng',
    functionName: 'transfer',
    functionArgs: [principalCV(address), uintCV(100)],
    senderKey: process.env.KEY,
    network: new StacksMainnet(),
    // fee: new BN(300),
    nonce: new BN(nonce),
    postConditionMode: PostConditionMode.Allow,
  });
  const result = await broadcastTransaction(tx, new StacksMainnet());
  if (!result.error) {
    nonce ++;
  }
  res.json(result);
})

app.get('/faucet-balance', async (req, res) => {
  const result = await fetch(`https://stacks-node-api.mainnet.stacks.co/extended/v1/address/${myAddress}/balances`);
  const json = await result.json();
  res.json(json)
})

app.get('/', (req, res) => {
  res.end('Sending nothing to everyone everywhere!');
})

app.listen(process.env.PORT, () => {
  console.log('listening on port', process.env.PORT)
});

