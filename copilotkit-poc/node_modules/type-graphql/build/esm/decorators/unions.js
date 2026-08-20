import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function createUnionType({ name, description, types, resolveType, }) {
    const unionMetadataSymbol = getMetadataStorage().collectUnionMetadata({
        name,
        description,
        getClassTypes: types,
        resolveType,
    });
    return unionMetadataSymbol;
}
