"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.b64encode = void 0;
// eslint-disable-next-line import/no-nodejs-modules
const buffer_1 = require("buffer");
/**
 * Base64 encoder that works in browser, worker, node runtimes.
 */
const b64encode = (str) => {
    return buffer_1.Buffer.from(str).toString('base64');
};
exports.b64encode = b64encode;
//# sourceMappingURL=base-64-encode.js.map