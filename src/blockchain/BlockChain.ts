import { Block } from "./Block";
import { Transaction } from "./Transaction";

export class Blockchain {
  public readonly chain: Block[];
  private readonly difficulty: number;
  private readonly miningReward: number;
  private pendingTransactions: Transaction[] = [];

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 4;
    this.miningReward = 50; // Set the mining reward to 50 units
  }

  minePendingTransactions(miningRewardAddress: string): void {
    const rewardTx = new Transaction(
      "MINING_REVARD",
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    this.pendingTransactions = [];
  }

  createGenesisBlock(): Block {
    return new Block(Date.now(), [], "0");
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction: Transaction): void {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to address");
    }

    if (!transaction.isValid()) {
      throw new Error("Cannot add invalid transaction to chain");
    }

    if (
      this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount
    ) {
      throw new Error("Not enough balance");
    }

    this.pendingTransactions.push(transaction);
    console.log("Transaction added to pending transactions");
  }

  getBalanceOfAddress(address: string): number {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  isValidChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check if all transactions in the current block are valid
      for (const transaction of currentBlock.transactions) {
        if (!transaction.isValid()) {
          return false;
        }
      }

      // Check if the current block's hash is correct
      if (currentBlock.calculateHash() !== currentBlock.hash) {
        return false;
      }

      // Check if the current block points to the correct previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}
