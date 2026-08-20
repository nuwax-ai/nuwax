/**
 * Parse a hub repo identifier (owner/name:hash, name, etc.).
 *
 * Prompts, agents, and skills share the same identifier grammar on Hub.
 */
export declare function parseHubIdentifier(identifier: string): [string, string, string];
