"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.URL = exports.DNS = void 0;
exports.stringToBytes = stringToBytes;
exports.default = v35;
const parse_js_1 = __importDefault(require("./parse.cjs"));
const stringify_js_1 = require("./stringify.cjs");
function stringToBytes(str) {
    // TODO: Use TextEncoder (see https://stackoverflow.com/a/48762658/109538)
    str = unescape(encodeURIComponent(str));
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; ++i) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}
exports.DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
exports.URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
function v35(version, hash, value, namespace, buf, offset) {
    const valueBytes = typeof value === "string" ? stringToBytes(value) : value;
    const namespaceBytes = typeof namespace === "string" ? (0, parse_js_1.default)(namespace) : namespace;
    if (typeof namespace === "string") {
        namespace = (0, parse_js_1.default)(namespace);
    }
    if (namespace?.length !== 16) {
        throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
    }
    // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`
    let bytes = new Uint8Array(16 + valueBytes.length);
    bytes.set(namespaceBytes);
    bytes.set(valueBytes, namespaceBytes.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bytes = hash(bytes);
    bytes[6] = (bytes[6] & 0x0f) | version;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    if (buf) {
        offset ??= 0;
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return (0, stringify_js_1.unsafeStringify)(bytes);
}
