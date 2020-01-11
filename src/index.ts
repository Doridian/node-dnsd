import { createSocket, Socket, RemoteInfo } from "dgram";
import { DNSPacket } from "./protocol";
import { DNSAnswer } from "./protocol/answer";

export abstract class DNSServer {
    protected socket?: Socket;

    constructor(private port: number) {

    }

    protected handleMessageInternal(msg: Buffer, rinfo: RemoteInfo) {
        const pkt = DNSPacket.fromBuffer(msg);

        const reply = (answers: DNSAnswer[]) => {
            pkt.answers = answers;
            this.socket!.send(pkt.toBuffer(), rinfo.port, rinfo.address);
        };

        this.handle(pkt, reply);
    }

    protected abstract handle(packet: DNSPacket, reply: (answers: DNSAnswer[]) => void): void;

    protected handleError(err: Error) {
        console.error(err.stack || err);
    }

    listen(cb: () => void) {
        if (this.socket) {
            this.socket.close();
        }

        this.socket = createSocket("udp4");
        this.socket.bind(this.port);

        this.socket.on("error", (err) => this.handleError(err));
        this.socket.on("listening", cb);
        this.socket.on("message", (msg, rinfo) => this.handleMessageInternal(msg, rinfo));
    }
}
