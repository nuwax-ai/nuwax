import { type GraphQLDirective, GraphQLSchema } from "graphql";
import { type BuildContextOptions } from "./build-context.js";
export type SchemaGeneratorOptions = {
    /**
     * Array of resolvers classes
     */
    resolvers: Function[];
    /**
     * Array of orphaned type classes that are not used explicitly in GraphQL types definitions
     */
    orphanedTypes?: Function[];
    /**
     * Disable checking on build the correctness of a schema
     */
    skipCheck?: boolean;
    /**
     * Array of graphql directives
     */
    directives?: GraphQLDirective[];
} & BuildContextOptions;
export declare abstract class SchemaGenerator {
    private static objectTypesInfo;
    private static inputTypesInfo;
    private static interfaceTypesInfo;
    private static enumTypesInfo;
    private static unionTypesInfo;
    private static usedInterfaceTypes;
    static generateFromMetadata(options: SchemaGeneratorOptions): GraphQLSchema;
    private static checkForErrors;
    private static getDefaultValue;
    private static buildTypesInfo;
    private static buildRootQueryType;
    private static buildRootMutationType;
    private static buildRootSubscriptionType;
    private static buildOtherTypes;
    private static generateHandlerFields;
    private static generateSubscriptionsFields;
    private static generateHandlerArgs;
    private static mapArgFields;
    private static getGraphQLOutputType;
    private static getGraphQLInputType;
    private static getResolveTypeFunction;
    private static filterHandlersByResolvers;
    private static filterTypesInfoByOrphanedTypesAndExtractType;
}
