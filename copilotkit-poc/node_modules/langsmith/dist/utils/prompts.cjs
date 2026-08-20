"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHubIdentifier = parseHubIdentifier;
const error_js_1 = require("./error.cjs");
/**
 * Parse a hub repo identifier (owner/name:hash, name, etc.).
 *
 * Prompts, agents, and skills share the same identifier grammar on Hub.
 */
function parseHubIdentifier(identifier) {
    if (!identifier ||
        identifier.split("/").length > 2 ||
        identifier.startsWith("/") ||
        identifier.endsWith("/") ||
        identifier.split(":").length > 2) {
        throw new Error((0, error_js_1.getInvalidPromptIdentifierMsg)(identifier));
    }
    const [ownerNamePart, commitPart] = identifier.split(":");
    const commit = commitPart || "latest";
    if (ownerNamePart.includes("/")) {
        const [owner, name] = ownerNamePart.split("/", 2);
        if (!owner || !name) {
            throw new Error((0, error_js_1.getInvalidPromptIdentifierMsg)(identifier));
        }
        return [owner, name, commit];
    }
    else {
        if (!ownerNamePart) {
            throw new Error((0, error_js_1.getInvalidPromptIdentifierMsg)(identifier));
        }
        return ["-", ownerNamePart, commit];
    }
}
