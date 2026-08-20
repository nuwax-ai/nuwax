"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PonyfillDecompressionStream = void 0;
const tslib_1 = require("tslib");
const node_zlib_1 = tslib_1.__importDefault(require("node:zlib"));
const TransformStream_js_1 = require("./TransformStream.js");
const utils_js_1 = require("./utils.js");
class PonyfillDecompressionStream extends TransformStream_js_1.PonyfillTransformStream {
    static supportedFormats = (0, utils_js_1.getSupportedFormats)();
    constructor(compressionFormat) {
        switch (compressionFormat) {
            case 'x-gzip':
            case 'gzip':
                super(node_zlib_1.default.createGunzip());
                break;
            case 'x-deflate':
            case 'deflate':
                super(node_zlib_1.default.createInflate());
                break;
            case 'deflate-raw':
                super(node_zlib_1.default.createInflateRaw());
                break;
            case 'br':
                super(node_zlib_1.default.createBrotliDecompress());
                break;
            case 'zstd':
                super(node_zlib_1.default.createZstdDecompress());
                break;
            default:
                throw new TypeError(`Unsupported compression format: '${compressionFormat}'`);
        }
    }
}
exports.PonyfillDecompressionStream = PonyfillDecompressionStream;
