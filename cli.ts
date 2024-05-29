import * as readline from "readline";
import { Blockchain } from "./Blockchain";
import { Wallet } from "./Wallet";

const myBlockchain = new Blockchain();
const myWallet = new Wallet();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function minePendingTransactions() {
  myBlockchain.minePendingTransactions(myWallet.publicKey);
  console.log("Mining completed");
}

async function createTransaction() {
  const toAddress = await new Promise<string>((resolve) =>
    rl.question("Enter the recipient address: ", resolve)
  );

  if (!toAddress) return console.log("Invalid address");

  const amount = await new Promise<string>((resolve) =>
    rl.question("Enter the amount: ", resolve)
  );

  const amountNumber = Number(amount);
  if (isNaN(amountNumber) || amountNumber <= 0) {
    return console.log("Invalid amount");
  }

  const balance = myBlockchain.getBalanceOfAddress(myWallet.publicKey);
  if (amountNumber > balance) {
    console.log("Insufficient balance for this transaction");
    return;
  }

  const transaction = myWallet.createTransaction(toAddress, Number(amount));
  myBlockchain.addTransaction(transaction);
  console.log("Transaction created");
}

function checkBalance() {
  const balance = myBlockchain.getBalanceOfAddress(myWallet.publicKey);
  console.log(`The balance is ${balance}`);
}

function showChain() {
  myBlockchain.chain.forEach((block, index) => {
    console.log(`\nBlock ${index}`);
    console.table({
      index: block.index,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: `${block.timestamp} | ${new Date(
        block.timestamp
      ).toLocaleString()}`,
      nonce: block.nonce,
    });

    if (block.transactions.length === 0) return;

    console.log(`Transactions for block ${index}`);
    block.transactions.forEach((transaction) => {
      console.table({
        from: transaction.fromAddress,
        to: transaction.toAddress,
        amount: transaction.amount,
        signature: transaction.signature,
      });
    });
  });
}

function exit() {
  rl.close();
  process.exit(0);
}

const menuQestions = [
  "What do you want to do?",
  "1. Mine pending transactions",
  "2. Create transaction",
  "3. Check balance",
  "4. Show chain",
  "5. Exit\n",
];

const menuLine = menuQestions.join("\n");

type action = (() => void) | (() => Promise<void>);
type MenuOptions = {
  [key: string]: action;
};

const menuOptions: MenuOptions = {
  "1": minePendingTransactions,
  "2": createTransaction,
  "3": checkBalance,
  "4": showChain,
  "5": exit,
};

async function main() {
  while (true) {
    const answer = await new Promise<string>((resolve) =>
      rl.question(menuLine, resolve)
    );

    const selectedOption: action = menuOptions[answer];

    if (selectedOption) {
      await selectedOption();
    } else {
      console.log("Invalid option");
    }

    console.log("\n----------------------------------------\n"); // Print a separator
  }
}

export { main };
