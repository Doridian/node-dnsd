import { DNSAnswer } from "./answer.js";
import { DNSQuestion } from "./question.js";
import { boolToBit, IDNSParseState } from "./util.js";

const DNS_SEG_PTR = 0b11000000;
const DNS_SEG_MAX = 0b00111111;

export const enum DNS_TYPE {
    A = 0x0001,
    AAAA = 0x001C,
    CNAME = 0x0005,
    // MX = 0x000F,
    NS = 0x0002,
    PTR = 0x000C,
    TXT = 0x0010,
}

export const enum DNS_CLASS {
    IN = 0x0001,
}

function parseDNSLabel(s: IDNSParseState) {
    const res = [];
    const donePointers = new Set<number>();
    let lastPos;
    let dataGood = false;

    while (s.pos < s.data.byteLength) {
        const segLen = s.data[s.pos++];
        if (segLen > DNS_SEG_MAX) {
            if ((segLen & DNS_SEG_PTR) !== DNS_SEG_PTR) {
                throw new Error(`Invalid DNS segment length ${segLen}`);
            }
            if (lastPos === undefined) {
                lastPos = s.pos + 1;
            }
            s.pos = ((segLen & DNS_SEG_MAX) << 8) | s.data[s.pos];
            if (donePointers.has(s.pos)) {
                throw new Error("Recursive pointers detected");
            }
            donePointers.add(s.pos);
            continue;
        }

        if (segLen === 0) {
            dataGood = true;
            break;
        }

        res.push(s.data.slice(s.pos, s.pos + segLen).toString("ascii"));
        s.pos += segLen;
    }

    if (lastPos !== undefined) {
        s.pos = lastPos;
    }

    if (!dataGood) {
        throw new Error("Unexpected DNS label end");
    }

    return res.join(".");
}

export class DNSPacket {
    public static fromBuffer(data: Buffer) {
        const dns = new DNSPacket();
        dns.id = data[1] + (data[0] << 8);

        // [2]
        const flagData = data[2];
        dns.qr = (flagData & 0b10000000) !== 0;
        dns.opcode = (flagData >>> 3) & 0b1111;
        dns.aa = (flagData & 0b100) !== 0;
        dns.tc = (flagData & 0b10) !== 0;
        dns.rd = (flagData & 0b1) !== 0;

        if (dns.qr) {
            throw new Error("Answer received, not question");
        }

        // [3]
        const rData = data[3];
        dns.ra = (rData & 0b10000000) !== 0;
        dns.rcode = rData & 0b1111;

        const qdcount = data[5] + (data[4] << 8);
        //const ancount = data[7] + (data[6] << 8);
        //const nscount = data[9] + (data[8] << 8);
        //const arcount = data[11] + (data[10] << 8);

        dns.questions = [];
        const state = { pos: 12, data };
        for (let i = 0; i < qdcount; i++) {
            const q = new DNSQuestion();
            q.name = parseDNSLabel(state);
            q.type = data[state.pos + 1] + (data[state.pos] << 8);
            q.class = data[state.pos + 3] + (data[state.pos + 2] << 8);
            state.pos += 4;
            dns.questions.push(q);
        }

        dns.answers = [];
        dns.authority = [];
        dns.additional = [];

        return dns;
    }

    public id = 0;
    public qr = false;
    public opcode = 0;
    public aa = false;
    public tc = false;
    public rd = true;
    public ra = false;
    public rcode = 0;
    public questions: DNSQuestion[] = []; // QDCOUNT
    public answers: DNSAnswer[] = []; // ANCOUNT
    public authority: DNSAnswer[] = []; // NSCOUNT
    public additional: DNSAnswer[] = []; // ARCOUNT

    public getFullLength() {
        let len = 12;
        this.questions.forEach((q) => {
            len += (q.name.length + 2) + 4;
        });
        this.answers.forEach((a) => {
            len += (a.name.length + 2) + 10 + a.getDataLen();
        });
        this.authority.forEach((a) => {
            len += (a.name.length + 2) + 10 + a.getDataLen();
        });
        this.additional.forEach((a) => {
            len += (a.name.length + 2) + 10 + a.getDataLen();
        });
        return len;
    }

    public toBuffer() {
        const packet = Buffer.alloc(this.getFullLength());

        packet[0] = (this.id >>> 8) & 0xFF;
        packet[1] = this.id & 0xFF;
        packet[2] = boolToBit(this.qr, 7) |
                    (this.opcode << 3) |
                    boolToBit(this.aa, 2) |
                    boolToBit(this.tc, 1) |
                    boolToBit(this.rd, 0);
        packet[3] = boolToBit(this.ra, 7) | this.rcode;

        const qdcount = this.questions.length;
        const ancount = this.answers.length;
        const nscount = this.authority.length;
        const arcount = this.additional.length;

        packet[4] = (qdcount >>> 8) & 0xFF;
        packet[5] = qdcount & 0xFF;
        packet[6] = (ancount >>> 8) & 0xFF;
        packet[7] = ancount & 0xFF;
        packet[8] = (nscount >>> 8) & 0xFF;
        packet[9] = nscount & 0xFF;
        packet[10] = (arcount >>> 8) & 0xFF;
        packet[11] = arcount & 0xFF;

        let pos = 12;

        for (let i = 0; i < qdcount; i++) {
            pos = this.questions[i].write(packet, pos);
        }
        for (let i = 0; i < ancount; i++) {
            pos = this.answers[i].write(packet, pos);
        }
        for (let i = 0; i < nscount; i++) {
            pos = this.authority[i].write(packet, pos);
        }
        for (let i = 0; i < arcount; i++) {
            pos = this.additional[i].write(packet, pos);
        }

        return packet;
    }
}
