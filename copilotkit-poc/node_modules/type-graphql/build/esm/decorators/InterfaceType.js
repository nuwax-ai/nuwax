import { getNameDecoratorParams } from "../helpers/decorators.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function InterfaceType(nameOrOptions, maybeOptions) {
    const { name, options } = getNameDecoratorParams(nameOrOptions, maybeOptions);
    const interfaceClasses = options.implements && [].concat(options.implements);
    return target => {
        getMetadataStorage().collectInterfaceMetadata({
            name: name || target.name,
            target,
            interfaceClasses,
            autoRegisteringDisabled: options.autoRegisterImplementations === false,
            ...options,
        });
    };
}
