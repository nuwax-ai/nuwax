"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validate_js_1 = __importDefault(require("./validate.cjs"));
function version(uuid) {
    if (!(0, validate_js_1.default)(uuid)) {
        throw TypeError("Invalid UUID");
    }
    return parseInt(uuid.slice(14, 15), 16);
}
exports.default = version;
