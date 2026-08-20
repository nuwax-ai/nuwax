import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function Resolver(objectTypeOrTypeFunc) {
    return target => {
        const getObjectType = objectTypeOrTypeFunc
            ? objectTypeOrTypeFunc.prototype
                ? () => objectTypeOrTypeFunc
                : objectTypeOrTypeFunc
            : () => {
                throw new Error(`No provided object type in '@Resolver' decorator for class '${target.name}!'`);
            };
        getMetadataStorage().collectResolverClassMetadata({
            target,
            getObjectType,
        });
    };
}
