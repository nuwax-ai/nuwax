import { getNameDecoratorParams } from "../helpers/decorators.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function ObjectType(nameOrOptions, maybeOptions) {
    const { name, options } = getNameDecoratorParams(nameOrOptions, maybeOptions);
    const interfaceClasses = options.implements && [].concat(options.implements);
    return target => {
        getMetadataStorage().collectObjectMetadata({
            name: name || target.name,
            target,
            description: options.description,
            interfaceClasses,
            simpleResolvers: options.simpleResolvers,
        });
    };
}
