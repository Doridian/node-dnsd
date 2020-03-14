import { DNSResult, DNS_CLASS, DNS_TYPE } from './index';
import { makeDNSLabel } from './util';

export class DNSAnswer {
    public name = '';
    public type = DNS_TYPE.A;
    public class = DNS_CLASS.IN;
    public ttl = 0;
    private data?: DNSResult;
    private dataRaw?: Buffer;

    public getTTL() {
        return this.ttl >>> 0;
    }

    public setData(data: DNSResult) {
        this.data = data;
        this.dataRaw = this.parseData(data);
    }

    public getData() {
        return this.data;
    }

    public getDataRaw() {
        return this.dataRaw;
    }

    public setDataRaw(dataRaw: Buffer) {
        this.dataRaw = dataRaw;
    }

    public getDataLen() {
        return this.dataRaw ? this.dataRaw.byteLength : 0;
    }

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

        packet[pos++] = (this.ttl >>> 24) & 0xFF;
        packet[pos++] = (this.ttl >>> 16) & 0xFF;
        packet[pos++] = (this.ttl >>> 8) & 0xFF;
        packet[pos++] = this.ttl & 0xFF;

        const dLen = this.getDataLen();
        packet[pos++] = (dLen >>> 8) & 0xFF;
        packet[pos++] = dLen & 0xFF;

        if (this.dataRaw) {
            for (let i = 0; i  < this.dataRaw.byteLength; i++) {
                packet[pos + i] = this.dataRaw[i];
            }
            pos += this.dataRaw.byteLength;
        }

        return pos;
    }

    private parseData(data: DNSResult) {
        if (typeof data !== 'string') {
            return data.toBuffer();
        }

        if (this.type === DNS_TYPE.CNAME || this.type === DNS_TYPE.NS || this.type === DNS_TYPE.PTR) {
            return makeDNSLabel(data);
        }

        return Buffer.from(data, 'ascii');
    }
}
