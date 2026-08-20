import zlib from 'node:zlib';
import { PonyfillTransformStream } from './TransformStream.js';
import { getSupportedFormats } from './utils.js';
export class PonyfillDecompressionStream extends PonyfillTransformStream {
    static supportedFormats = getSupportedFormats();
    constructor(compressionFormat) {
        switch (compressionFormat) {
            case 'x-gzip':
            case 'gzip':
                super(zlib.createGunzip());
                break;
            case 'x-deflate':
            case 'deflate':
                super(zlib.createInflate());
                break;
            case 'deflate-raw':
                super(zlib.createInflateRaw());
                break;
            case 'br':
                super(zlib.createBrotliDecompress());
                break;
            case 'zstd':
                super(zlib.createZstdDecompress());
                break;
            default:
                throw new TypeError(`Unsupported compression format: '${compressionFormat}'`);
        }
    }
}
