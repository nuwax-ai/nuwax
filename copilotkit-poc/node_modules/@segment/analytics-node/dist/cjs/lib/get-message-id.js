"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageId = void 0;
const uuid_1 = require("./uuid");
/**
 * get a unique messageId with a very low chance of collisions
 * using @lukeed/uuid/secure uses the node crypto module, which is the fastest
 * @example "node-next-1668208232027-743be593-7789-4b74-8078-cbcc8894c586"
 */
const createMessageId = () => {
    return `node-next-${Date.now()}-${(0, uuid_1.uuid)()}`;
};
exports.createMessageId = createMessageId;
//# sourceMappingURL=get-message-id.js.map