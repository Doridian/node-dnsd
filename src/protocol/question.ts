import { DNS_CLASS, DNS_TYPE } from './index';
import { makeDNSLabel } from './util';

export class DNSQuestion {
    public name = '';
    public type = DNS_TYPE.A;
    public class = DNS_CLASS.IN;

    public write(packet: Buffer, pos: number) {
        const nameLbL = makeDNSLabel(this.name);
        for (let i = 0; i < nameLbL.byteLength; i++) {
            packet[pos + i] = nameLbL[i];
        }
        pos += nameLbL.byteLength;

        packet[pos++] = (this.type >>> 8) & 0xFF;
        packet[pos++] = this.type & 0xFF;
        packet[pos++] = (this.class >>> 8) & 0xFF;
        packet[pos++] = this.class & 0xFF;

        return pos;
    }
}
