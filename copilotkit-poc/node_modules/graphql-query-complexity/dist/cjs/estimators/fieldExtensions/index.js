"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    return (args) => {
        if (args.field.extensions) {
            // Calculate complexity score
            if (typeof args.field.extensions.complexity === 'number') {
                return args.childComplexity + args.field.extensions.complexity;
            }
            else if (typeof args.field.extensions.complexity === 'function') {
                return args.field.extensions.complexity(args);
            }
        }
    };
}
exports.default = default_1;
