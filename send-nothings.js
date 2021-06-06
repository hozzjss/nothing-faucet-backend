// const { cvToString, intCV } = require("@blockstack/stacks-transactions");
const {
  principalCV,
} = require("@blockstack/stacks-transactions/lib/clarity/types/principalCV");
const {
  AnchorMode,
  PostConditionMode,
} = require("@blockstack/stacks-transactions/lib/constants");
const { StacksMainnet } = require("@stacks/network");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("db.json");
const db = low(adapter);

db.defaults({ addresses: [], count: 0 }).write();

const {
  uintCV,
  makeContractCall,
  broadcastTransaction,
  makeContractFungiblePostCondition,
  getNonce,
} = require("@stacks/transactions");
require("dotenv").config();
const BN = require("bn.js");

const app = require("express")();
app.use(require("cors")());
app.use(require("body-parser").json());
const myAddress = process.env.STX_ADDRESS;
// let nonce = 0;
const fetch = require("node-fetch");
const { noneCV } = require("@blockstack/stacks-transactions");

const getBalance = async (address) => {
  const result = await fetch(
    `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/${address}/balances`
  );
  return result.json();
};
(async () => {
  let nonce = await getNonce(myAddress, new StacksMainnet());
  app.post("/faucet", async (req, res) => {
    // return res.status(400).json({
    //   message: "Thanks for joining the airdrop! come back soon for more MicroNothing!"
    // })
    const { address } = req.body;

    const addressInDb = db.get("addresses").find({ id: address }).value();
    // if (addressInDb) {
    //   console.log(addressInDb);
    // }

    // const addressNothingBalance = await getBalance(address).then(data => {
    //   const nothingBal = data.fungible_tokens[
    //     'SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.micro-nthng::micro-nothing'
    //   ];
    //   if (nothingBal) {
    //     return nothingBal.balance;
    //   }
    //   return 0;
    // })
    if (addressInDb) {
      return res.status(400).json({
        message: "Sorry you already got enough nothings!",
      });
    }

    const tx = await makeContractCall({
      contractAddress: "SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ",
      contractName: "wrapped-nothing-v8",
      functionName: "transfer",
      functionArgs: [
        uintCV(1000000),
        principalCV("SP31596TY1N33159BQCVEC9H16HP0KQ2VTD140157"),
        principalCV(address),
        noneCV(),
      ],
      senderKey: process.env.KEY,
      network: new StacksMainnet(),
      // fee: new BN(300),
      nonce: new BN(nonce),
      postConditionMode: PostConditionMode.Allow,
    });
    const result = await broadcastTransaction(tx, new StacksMainnet());
    nonce++;
    if (!result.error) {
      db.get("addresses").push({ id: address }).write();
    }
    if (result.error) {
      return res.status(400).json({
        message: "Please try again later",
        error: JSON.stringify(result),
      });
    }
    res.json(result);
  });

  app.get("/faucet-balance", async (req, res) => {
    const json = await getBalance(myAddress);
    res.json(json);
  });

  app.get("/", (req, res) => {
    res.end("Sending nothing to everyone everywhere!");
  });

  app.listen(process.env.PORT, () => {
    console.log("listening on port", process.env.PORT);
  });
})();
