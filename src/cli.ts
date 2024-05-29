import * as readline from "readline";
import { Blockchain } from "./blockchain/BlockChain";
import { Wallet } from "./blockchain/Wallet";

class CLI {
  private blockchain: Blockchain;
  private wallet: Wallet;
  private rl: readline.Interface;

  constructor() {
    this.blockchain = new Blockchain();
    this.wallet = new Wallet();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start() {
    while (true) {
      const answer = await this.promptUser(this.getMenu());
      const action = this.getMenuOptions()[answer];

      if (action) {
        await action();
      } else {
        console.log("Invalid option");
      }

      console.log("\n----------------------------------------\n"); // Print a separator
    }
  }

  private async minePendingTransactions() {
    this.blockchain.minePendingTransactions(this.wallet.publicKey);
    console.log("Mining completed");
  }

  private async createTransaction() {
    const toAddress = await this.promptUser("Enter the recipient address: ");

    if (!toAddress) {
      console.log("Invalid address");
      return;
    }

    const amount = await this.promptUser("Enter the amount: ");
    const amountNumber = Number(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
      console.log("Invalid amount");
      return;
    }

    const balance = this.blockchain.getBalanceOfAddress(this.wallet.publicKey);
    if (amountNumber > balance) {
      console.log("Insufficient balance for this transaction");
      return;
    }

    const transaction = this.wallet.createTransaction(toAddress, amountNumber);
    this.blockchain.addTransaction(transaction);
    console.log("Transaction created");
  }

  private checkBalance() {
    const balance = this.blockchain.getBalanceOfAddress(this.wallet.publicKey);
    console.log(`The balance is ${balance}`);
  }

  private showChain() {
    this.blockchain.chain.forEach((block, index) => {
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

  private exit() {
    this.rl.close();
    process.exit(0);
  }

  private getMenu(): string {
    const menuQuestions = [
      "What do you want to do?",
      "1. Mine pending transactions",
      "2. Create transaction",
      "3. Check balance",
      "4. Show chain",
      "5. Exit\n",
    ];
    return menuQuestions.join("\n");
  }

  private getMenuOptions(): { [key: string]: () => void | Promise<void> } {
    return {
      "1": this.minePendingTransactions.bind(this),
      "2": this.createTransaction.bind(this),
      "3": this.checkBalance.bind(this),
      "4": this.showChain.bind(this),
      "5": this.exit.bind(this),
    };
  }

  private async promptUser(question: string): Promise<string> {
    return new Promise<string>((resolve) =>
      this.rl.question(question, resolve)
    );
  }
}

export { CLI };
