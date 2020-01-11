import { DNSServer, DNSReplyFunc } from "./server";
import { DNSPacket, DNS_TYPE, DNS_CLASS } from "./protocol";
import { DNSAnswer } from "./protocol/answer";
import { IPAddress } from "./protocol/ipaddr";

export class DNSSimpleServer extends DNSServer {
    protected handle(packet: DNSPacket, reply: DNSReplyFunc): void {
        const q = packet.questions[0];
        if (q && q.name === 'example.com' && q.class === DNS_CLASS.IN) {
            const a = new DNSAnswer();
            a.name = q.name;
            a.type = q.type;
            a.class = DNS_CLASS.IN;
            a.ttl = 60;
            switch (q.type) {
                case DNS_TYPE.A:
                    a.setData(IPAddress.fromString("127.0.0.1"));
                    break;
                case DNS_TYPE.AAAA:
                    a.setData(IPAddress.fromString("1:3:3:7::12:34"));
                    break;
            }
            reply([a]);
            return;
        }
        reply([]);
    }   
}

const server = new DNSSimpleServer(1153);
server.listen(() => console.log("Ready"));

