"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComplexityRule = void 0;
const QueryComplexity_js_1 = __importDefault(require("./QueryComplexity.js"));
function createComplexityRule(options) {
    return (context) => {
        return new QueryComplexity_js_1.default(context, options);
    };
}
exports.createComplexityRule = createComplexityRule;
