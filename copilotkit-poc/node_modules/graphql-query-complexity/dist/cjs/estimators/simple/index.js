"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(options) {
    const defaultComplexity = options && typeof options.defaultComplexity === 'number'
        ? options.defaultComplexity
        : 1;
    return (args) => {
        return defaultComplexity + args.childComplexity;
    };
}
exports.default = default_1;
