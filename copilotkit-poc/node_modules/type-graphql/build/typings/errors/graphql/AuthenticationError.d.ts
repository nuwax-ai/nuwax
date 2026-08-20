import { GraphQLError } from "graphql";
export declare class AuthenticationError extends GraphQLError {
    readonly extensions: {
        code: "UNAUTHENTICATED";
        [attributeName: string]: unknown;
    };
    constructor(message?: string);
}
