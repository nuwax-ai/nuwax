/**
 * A simplified, GraphQL v15 compatible version of
 * https://github.com/graphql-hive/federation-composition/blob/main/src/utils/link/index.ts
 * that does not provide the same safeguards or functionality, but still can determine the
 * correct name of an linked resource.
 */
import { type DocumentNode } from 'graphql';
type FederationNamedImport = {
    name: string;
    as?: string;
};
type FederationLinkUrl = {
    identity: string;
    name: string | null;
    version: string | null;
};
type FederatedLink = {
    url: FederationLinkUrl;
    as?: string;
    imports: FederationNamedImport[];
};
export declare function resolveImportName(link: FederatedLink, elementName: string): string;
export declare function extractLinks(typeDefs: DocumentNode): FederatedLink[];
export {};
