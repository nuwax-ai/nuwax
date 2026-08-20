import { uuid } from './uuid';
/**
 * get a unique messageId with a very low chance of collisions
 * using @lukeed/uuid/secure uses the node crypto module, which is the fastest
 * @example "node-next-1668208232027-743be593-7789-4b74-8078-cbcc8894c586"
 */
export const createMessageId = () => {
    return `node-next-${Date.now()}-${uuid()}`;
};
//# sourceMappingURL=get-message-id.js.map