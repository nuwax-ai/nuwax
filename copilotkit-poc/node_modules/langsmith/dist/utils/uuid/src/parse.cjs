"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validate_js_1 = __importDefault(require("./validate.cjs"));
function parse(uuid) {
    if (!(0, validate_js_1.default)(uuid)) {
        throw TypeError("Invalid UUID");
    }
    let v;
    return Uint8Array.of((v = parseInt(uuid.slice(0, 8), 16)) >>> 24, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff, 
    // Parse ........-####-....-....-............
    (v = parseInt(uuid.slice(9, 13), 16)) >>> 8, v & 0xff, 
    // Parse ........-....-####-....-............
    (v = parseInt(uuid.slice(14, 18), 16)) >>> 8, v & 0xff, 
    // Parse ........-....-....-####-............
    (v = parseInt(uuid.slice(19, 23), 16)) >>> 8, v & 0xff, 
    // Parse ........-....-....-....-############
    // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)
    ((v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff, (v / 0x100000000) & 0xff, (v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
}
exports.default = parse;
