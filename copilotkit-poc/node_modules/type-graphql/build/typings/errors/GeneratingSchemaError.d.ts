import { type GraphQLError } from "graphql";
export declare class GeneratingSchemaError extends Error {
    details: readonly GraphQLError[];
    constructor(details: readonly GraphQLError[]);
}
