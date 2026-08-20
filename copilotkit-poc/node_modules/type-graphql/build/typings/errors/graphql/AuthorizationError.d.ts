import { GraphQLError } from "graphql";
export declare class AuthorizationError extends GraphQLError {
    readonly extensions: {
        code: "UNAUTHORIZED";
        [attributeName: string]: unknown;
    };
    constructor(message?: string);
}
