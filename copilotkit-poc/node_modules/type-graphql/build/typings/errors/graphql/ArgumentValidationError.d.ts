import { type ValidationError } from "class-validator";
import { GraphQLError } from "graphql";
export declare class ArgumentValidationError extends GraphQLError {
    readonly extensions: {
        code: "BAD_USER_INPUT";
        validationErrors: ValidationError[];
        [attributeName: string]: unknown;
    };
    constructor(validationErrors: ValidationError[]);
}
