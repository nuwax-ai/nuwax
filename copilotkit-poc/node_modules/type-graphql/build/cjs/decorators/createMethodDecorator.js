"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMethodDecorator = void 0;
const UseMiddleware_1 = require("./UseMiddleware");
function createMethodDecorator(resolver) {
    return (0, UseMiddleware_1.UseMiddleware)(resolver);
}
exports.createMethodDecorator = createMethodDecorator;
