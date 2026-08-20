"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wcswidth = exports.wcwidth = void 0;
const wcswidth_js_1 = __importDefault(require("./src/wcswidth.cjs"));
exports.wcswidth = wcswidth_js_1.default;
const wcwidth_js_1 = __importDefault(require("./src/wcwidth.cjs"));
exports.wcwidth = wcwidth_js_1.default;
