import { Socket } from "net";
import { Peer } from "./Peer";

class Connection {
  private readonly host: string;
  private readonly port: number;
  private readonly peer: Peer;
  private readonly hosts: string[];

  constructor(host: string, port: number, hosts: string[] = []) {
    this.host = host;
    this.port = port;
    this.hosts = hosts;

    console.log("\n\n");

    process.stdin.on("data", (bufferData) => {
      const data = bufferData.toString().trim();
      this.onNewInputMessage(data);
    });

    this.peer = new Peer(this.port);

    this.hosts.forEach((peerAddress) => this.peer.connectTo(peerAddress));

    this.peer.onConnection = (socket) => this.onConnection(socket);
    this.peer.onData = (socket, data) => this.onData(socket, data);
  }

  private onNewInputMessage(data: string): void {
    if (data === "") {
      return;
    }

    if (!this.peer) {
      console.log("There's no active peer");
      return;
    }

    this.peer.broadcastMessage({
      type: "message",
      message: data,
      myPort: this.port,
    });
  }

  private onConnection(socket: Socket): void {
    console.log(
      `New connection from ${socket.remoteAddress}:${socket.remotePort}`
    );
  }

  private onData(socket: Socket, data: any): void {
    const { remoteAddress } = socket;
    const { type, message, myPort } = data;

    if (type === "message") {
      console.log(`\n[Message from ${remoteAddress}:${myPort}]: ${message}`);
    }
  }
}

function getPort(): number {
  const port = process.env.PORT;
  if (!port) throw new Error("PORT not found");
  return parseInt(port, 10);
}

function getHosts(): string[] {
  return process.argv.slice(2);
}

new Connection("localhost", getPort(), getHosts());
