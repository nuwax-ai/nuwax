"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PonyfillCompressionStream = void 0;
const tslib_1 = require("tslib");
const node_zlib_1 = tslib_1.__importDefault(require("node:zlib"));
const TransformStream_js_1 = require("./TransformStream.js");
const utils_js_1 = require("./utils.js");
class PonyfillCompressionStream extends TransformStream_js_1.PonyfillTransformStream {
    static supportedFormats = (0, utils_js_1.getSupportedFormats)();
    constructor(compressionFormat) {
        switch (compressionFormat) {
            case 'x-gzip':
            case 'gzip':
                super(node_zlib_1.default.createGzip());
                break;
            case 'x-deflate':
            case 'deflate':
                super(node_zlib_1.default.createDeflate());
                break;
            case 'deflate-raw':
                super(node_zlib_1.default.createDeflateRaw());
                break;
            case 'br':
                super(node_zlib_1.default.createBrotliCompress());
                break;
            case 'zstd':
                super(node_zlib_1.default.createZstdCompress());
                break;
            default:
                throw new Error(`Unsupported compression format: ${compressionFormat}`);
        }
    }
}
exports.PonyfillCompressionStream = PonyfillCompressionStream;
