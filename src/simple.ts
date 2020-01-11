import { DNSServer, DNSReplyFunc } from ".";
import { DNSPacket, DNS_TYPE, DNS_CLASS } from "./protocol";
import { DNSAnswer } from "./protocol/answer";
import { IPAddress } from "./protocol/util";

export class DNSSimpleServer extends DNSServer {
    protected handle(packet: DNSPacket, reply: DNSReplyFunc): void {
        const q = packet.questions[0];
        console.log(q);
        if (q && q.name === 'example.com' && q.class === DNS_CLASS.IN && q.type === DNS_TYPE.A) {
            const a = new DNSAnswer();
            a.name = q.name;
            a.type = DNS_TYPE.A;
            a.class = DNS_CLASS.IN;
            a.ttl = 60;
            a.setData(IPAddress.fromString("127.0.0.1"));
            console.log(a);
            reply([a]);
            return;
        }
        reply([]);
    }   
}

const server = new DNSSimpleServer(1153);
server.listen(() => console.log("Ready"));

