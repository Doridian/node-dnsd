const DOT_CHAR = '.'.charCodeAt(0);

export function makeDNSLabel(str: string) {
    const data = Buffer.from(`.${str}\0`, 'ascii');

    let len = 0
    let lastDot = 0;
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
