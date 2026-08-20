import { ValidationTypes } from '../../validation/ValidationTypes';
import { ValidationMetadata } from '../../metadata/ValidationMetadata';
import { getMetadataStorage } from '../../metadata/MetadataStorage';
export var IS_OPTIONAL = 'isOptional';
/**
 * Checks if value is missing and if so, ignores all validators.
 */
export function IsOptional(validationOptions) {
    return function (object, propertyName) {
        var args = {
            type: ValidationTypes.CONDITIONAL_VALIDATION,
            name: IS_OPTIONAL,
            target: object.constructor,
            propertyName: propertyName,
            constraints: [
                function (object, value) {
                    return object[propertyName] !== null && object[propertyName] !== undefined;
                },
            ],
            validationOptions: validationOptions,
        };
        getMetadataStorage().addValidationMetadata(new ValidationMetadata(args));
    };
}
//# sourceMappingURL=IsOptional.js.map