"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const regex_js_1 = __importDefault(require("./regex.cjs"));
function validate(uuid) {
    return typeof uuid === "string" && regex_js_1.default.test(uuid);
}
exports.default = validate;
