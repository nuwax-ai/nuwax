import { MetadataStorage } from "./metadata-storage.js";
declare global {
    var TypeGraphQLMetadataStorage: MetadataStorage;
}
export declare function getMetadataStorage(): MetadataStorage;
