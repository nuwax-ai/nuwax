import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function registerEnumType(enumObj, enumConfig) {
    getMetadataStorage().collectEnumMetadata({
        enumObj,
        name: enumConfig.name,
        description: enumConfig.description,
        valuesConfig: enumConfig.valuesConfig || {},
    });
}
