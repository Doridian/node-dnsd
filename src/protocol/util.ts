const DOT_CHAR = '.'.charCodeAt(0);

export class IPAddress {
    constructor(private data: Buffer) {
    }

    static fromString(ip: string) {
        if (ip.includes('.')) {
            const spls = ip.split('.');
            if (spls.length !== 4) {
                throw new Error('Invalid IPv4');
            }
            const buf = Buffer.alloc(4);
            for (let i = 0; i < 4; i++) {
                buf[i] = parseInt(spls[i], 10);
            }
            return new IPAddress(buf);
        }

        const buf = Buffer.alloc(16);
        let bufPos = 0;
        const spls = ip.split(':');
        for (let i = 0; i < spls.length; i++) {
            const spl = spls[i];
            if (spl === '') {
                const toFill = (16 - spls.length) * 2;
                bufPos += toFill;
                continue;
            }

            const ipData = parseInt(spl, 16);
            buf[bufPos] = ipData & 0xFF;
            buf[bufPos + 1] = (ipData >>> 8) & 0xFF;
            bufPos += 2;
        }
        return new IPAddress(buf);
    }

    toString() {
        if (this.data.length === 4) {
            return `${this.data[0].toString(10)}.${this.data[1].toString(10)}.${this.data[2].toString(10)}.${this.data[3].toString(10)}`;
        }
        // TODO: IPv6
    }

    toBuffer() {
        return this.data;
    }
}

export function makeDNSLabel(str: string) {
    const data = Buffer.from(`.${str}\0`, "ascii");

    let len = 0, lastDot = 0;
    for (let i = 0; i < data.byteLength - 1; i++) {
        const c = data[i];
        if (c === DOT_CHAR) {
            data[lastDot] = len;
            len = 0;
            lastDot = i;
            continue;
        }
        len++;
    }

    data[lastDot] = len;

    return data;
}

export function boolToBit(bool: boolean, bit: number) {
    return bool ? (1 << bit) : 0;
}

export type DNSResult = string | IPAddress;
export interface IDNSParseState { pos: number; data: Buffer; }
export type DNSCallback = (result: DNSResult) => void;
