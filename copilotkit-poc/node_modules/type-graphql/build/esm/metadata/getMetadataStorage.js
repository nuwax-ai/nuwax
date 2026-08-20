import { MetadataStorage } from "./metadata-storage.js";
export function getMetadataStorage() {
    if (!global.TypeGraphQLMetadataStorage) {
        global.TypeGraphQLMetadataStorage = new MetadataStorage();
    }
    return global.TypeGraphQLMetadataStorage;
}
