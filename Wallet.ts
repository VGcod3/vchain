import { Transaction } from './Transaction';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export class Wallet {
  public publicKey: string;
  private readonly privateKey: string;
  
  constructor() {
    const keypair = ec.genKeyPair();
    this.publicKey = keypair.getPublic('hex');
    this.privateKey = keypair.getPrivate('hex');
  }
  
  createTransaction(toAddress: string, amount: number): Transaction {
    const transaction = new Transaction(this.publicKey, toAddress, amount);
    transaction.signTransaction(ec.keyFromPrivate(this.privateKey));
    return transaction;
  }
}