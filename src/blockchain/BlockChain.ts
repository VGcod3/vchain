import { Block } from "./Block";
import { Transaction } from "./Transaction";

export class Blockchain {
  public readonly chain: Block[];
  private readonly difficulty: number;
  private readonly miningReward: number;
  private pendingTransactions: Transaction[] = [];

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.miningReward = 50; // Set the mining reward to 50 units
  }

  minePendingTransactions(miningRewardAddress: string): void {
    // Limit the number of transactions per block
    const transactionLimit = 10;
    const txSubArray = this.pendingTransactions.slice(0, transactionLimit);

    // Include the mining reward as a transaction in the block
    const rewardTx = new Transaction(
      "MINING_REWARD",
      miningRewardAddress,
      this.miningReward
    );
    txSubArray.push(rewardTx);

    const block = new Block(
      this.chain.length,
      Date.now(),
      txSubArray,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    console.log("Block successfully mined!");
    this.chain.push(block);

    // Remove mined transactions from the pending transactions array
    this.pendingTransactions = this.pendingTransactions.slice(transactionLimit);
  }

  createGenesisBlock(): Block {
    return new Block(0, Date.now(), [], "0");
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction: Transaction): void {
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
