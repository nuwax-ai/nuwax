import { ValidationOptions } from '../ValidationOptions';
export declare const IS_OPTIONAL = "isOptional";
/**
 * Checks if value is missing and if so, ignores all validators.
 */
export declare function IsOptional(validationOptions?: ValidationOptions): PropertyDecorator;
