import net, { Socket } from "net";

interface Host {
  host: string;
  port: number;
}

export class Peer {
  private readonly port: number;
  private connections: Socket[];
  private knownHosts: Host[];

  constructor(port: number) {
    this.port = port;
    this.connections = [];
    this.knownHosts = [];

    const server = net.createServer((socket) =>
      this.handleClientConnection(socket)
    );
    server.listen(port, () => console.log("Listening on port: ", port));
  }

  connectTo(address, sendKnownHosts = true, loopback = false) {
    const splittedAddress = address.split(":");

    if (splittedAddress.length < 2) {
      throw Error("Invalid host address. Expected host:port ");
    }

    const port = splittedAddress.splice(-1, 1)[0];
    const host = splittedAddress.join(":");

    const socket = net.createConnection({ port, host }, () => {
      // Add Peer to the active connection list
      this.addConnection(socket);

      // Activates the study of data sent by the client
      this.listenClientData(socket);

      // Send the welcome message to the server
      this.sendWelcomeMessage(socket, this.port, loopback, sendKnownHosts);

      console.log("Connected to", address);
      console.log("\n\n");
    });
  }

  private sendWelcomeMessage(
    socket: Socket,
    myPort: number,
    loopback: boolean,
    sendKnownHosts: boolean
  ): void {
    const message = {
      type: "welcome",
      myPort,
      loopback,
      knownHosts: sendKnownHosts ? this.knownHosts : [],
    };
    this.sendMessage(socket, message);
  }

  private handleWelcomeMessage(socket: Socket, data: any): void {
    if (data.type !== "welcome") return;

    const { remoteAddress } = socket;
    const { myPort, knownHosts, loopback } = data;

    this.connectToReceivedKnownHosts(knownHosts);
    const hostObj = { host: remoteAddress, port: myPort };
    this.addKnownHost(hostObj as Host);

    if (!loopback) {
      this.connectTo(`${remoteAddress}:${myPort}`, true, true);
    }
  }

  private connectToReceivedKnownHosts(knownHosts: Host[]): void {
    knownHosts.forEach((hostObj) => this.connectToNewKnownHost(hostObj));
  }

  private connectToNewKnownHost(hostObj: Host): void {
    if (!this.isKnownHost(hostObj)) {
      this.connectTo(`${hostObj.host}:${hostObj.port}`);
    }
  }

  private addKnownHost(hostObj: Host): void {
    if (!this.isKnownHost(hostObj)) {
      console.log("Added known host", hostObj);
      this.knownHosts.push(hostObj);
    }
  }

  private addConnection(socket: Socket): void {
    this.connections.push(socket);
  }

  private isKnownHost(hostObj: Host): boolean {
    return this.knownHosts.some(
      (knownHost) =>
        knownHost.host === hostObj.host && knownHost.port === hostObj.port
    );
  }

  private handleClientConnection(socket: Socket): void {
    this.listenClientData(socket);
  }

  private listenClientData(socket: Socket): void {
    this.onConnection(socket);

    socket.on("data", (bufferData) => {
      try {
        const data = JSON.parse(bufferData.toString());
        this.onData(socket, data);
        this.handleWelcomeMessage(socket, data);
      } catch (err) {
        console.error("Error handling data:", err);
      }
    });
  }

  public onData(socket: Socket, data: any): void {
    throw new Error("onData handler not implemented");
  }

  public onConnection(socket: Socket): void {
    throw new Error("onConnection handler not implemented");
  }

  broadcastMessage(jsonData: any): void {
    this.connections.forEach((socket) => this.sendMessage(socket, jsonData));
  }

  private sendMessage(socket: Socket, jsonData: any): void {
    const data = JSON.stringify(jsonData);
    if (!socket.destroyed) {
      socket.write(data);
    }
  }
}
