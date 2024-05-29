import { Transaction } from "./Transaction";
import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");

export class Wallet {
  public publicKey: string;
  private readonly keypair: EC.KeyPair;

  constructor() {
    this.keypair = ec.genKeyPair();
    this.publicKey = this.keypair.getPublic("hex");
  }

  createTransaction(toAddress: string, amount: number): Transaction {
    const transaction = new Transaction(this.publicKey, toAddress, amount);
    const signingKey = ec.keyFromPrivate(this.keypair.getPrivate("hex"));

    transaction.signTransaction(signingKey);
    return transaction;
  }
}
