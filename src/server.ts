import { createSocket, Socket, RemoteInfo, SocketType } from 'dgram';
import { DNSPacket, DNS_RCODE } from './protocol';
import { DNSAnswer } from './protocol/answer';

export type DNSReplyFunc = (answers: DNSAnswer[], rcode?: DNS_RCODE) => void;

export abstract class DNSServer {
    protected socket?: Socket;

    constructor(
            private port: number,
            private address?: string,
            private family: SocketType = 'udp4') {

    }

    listen(cb: () => void) {
        if (this.socket) {
            this.socket.close();
        }

        this.socket = createSocket(this.family);
        this.socket.bind(this.port, this.address);

        this.socket.on('error', err => this.handleError(err));
        this.socket.on('listening', cb);
        this.socket.on('message', (msg, rinfo) => this.handleMessageInternal(msg, rinfo));
    }

    protected handleMessageInternal(msg: Buffer, rinfo: RemoteInfo) {
        const pkt = DNSPacket.fromBuffer(msg);

        const reply = (answers: DNSAnswer[], rcode: DNS_RCODE = DNS_RCODE.NOERROR) => {
            pkt.answers = answers;
            pkt.qr = true;
            pkt.ra = false;
            pkt.aa = false;
            pkt.tc = false;
            pkt.rcode = rcode;
            this.socket!.send(pkt.toBuffer(), rinfo.port, rinfo.address);
        };

        this.handle(pkt, reply);
    }

    protected abstract handle(packet: DNSPacket, reply: DNSReplyFunc): void;

    protected handleError(err: Error) {
        console.error(err.stack || err);
    }
}
