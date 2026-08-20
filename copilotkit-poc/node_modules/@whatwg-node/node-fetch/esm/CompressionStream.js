import zlib from 'node:zlib';
import { PonyfillTransformStream } from './TransformStream.js';
import { getSupportedFormats } from './utils.js';
export class PonyfillCompressionStream extends PonyfillTransformStream {
    static supportedFormats = getSupportedFormats();
    constructor(compressionFormat) {
        switch (compressionFormat) {
            case 'x-gzip':
            case 'gzip':
                super(zlib.createGzip());
                break;
            case 'x-deflate':
            case 'deflate':
                super(zlib.createDeflate());
                break;
            case 'deflate-raw':
                super(zlib.createDeflateRaw());
                break;
            case 'br':
                super(zlib.createBrotliCompress());
                break;
            case 'zstd':
                super(zlib.createZstdCompress());
                break;
            default:
                throw new Error(`Unsupported compression format: ${compressionFormat}`);
        }
    }
}
