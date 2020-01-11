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
                bufPos = 18 - ((spls.length - i) * 2);
                continue;
            }

            const ipData = parseInt(spl, 16);
            buf[bufPos + 1] = ipData & 0xFF;
            buf[bufPos] = (ipData >>> 8) & 0xFF;
            bufPos += 2;
        }
        return new IPAddress(buf);
    }

    toString() {
        if (this.data.length === 4) {
            return `${this.data[0].toString(10)}.${this.data[1].toString(10)}.${this.data[2].toString(10)}.${this.data[3].toString(10)}`;
        }

        let ret = [];
        for (let i = 0; i < 16; i += 2) {
            ret.push(`${this.data[i+1].toString(16)}${this.data[i].toString(16)}`);
        }
        return ret.join(':');
    }

    toBuffer() {
        return this.data;
    }
}