import { type NullableListOptions } from "../decorators/types.js";
export declare class WrongNullableListOptionError extends Error {
    constructor(targetName: string, propertyName: string, nullable: boolean | NullableListOptions | undefined);
}
