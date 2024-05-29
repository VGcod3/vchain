import * as crypto from "crypto";
import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");

export class Transaction {
  public signature: string = "";
  public readonly amount: number;
  public readonly fromAddress: string;
  public readonly toAddress: string;

  constructor(fromAddress: string, toAddress: string, amount: number) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  public calculateHash(): string {
    return crypto
      .createHash("sha256")
      .update(this.fromAddress + this.toAddress + this.amount)
      .digest("hex");
  }

  public signTransaction(signingKey: EC.KeyPair): void {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallets!");
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
  }

  public isValid(): boolean {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("No signature in this transaction");
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}
