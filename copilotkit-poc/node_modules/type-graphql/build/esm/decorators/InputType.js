import { getNameDecoratorParams } from "../helpers/decorators.js";
import { getMetadataStorage } from "../metadata/getMetadataStorage.js";
export function InputType(nameOrOptions, maybeOptions) {
    const { name, options } = getNameDecoratorParams(nameOrOptions, maybeOptions);
    return target => {
        getMetadataStorage().collectInputMetadata({
            name: name || target.name,
            target,
            description: options.description,
        });
    };
}
