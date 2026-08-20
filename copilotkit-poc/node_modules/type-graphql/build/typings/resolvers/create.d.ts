import { type GraphQLFieldResolver } from "graphql";
import { type BaseResolverMetadata, type FieldMetadata, type FieldResolverMetadata } from "../metadata/definitions/index.js";
import { type IOCContainer } from "../utils/container.js";
export declare function createHandlerResolver(resolverMetadata: BaseResolverMetadata): GraphQLFieldResolver<any, any, any>;
export declare function createAdvancedFieldResolver(fieldResolverMetadata: FieldResolverMetadata): GraphQLFieldResolver<any, any, any>;
export declare function createBasicFieldResolver(fieldMetadata: FieldMetadata): GraphQLFieldResolver<any, any, any>;
export declare function wrapResolverWithAuthChecker(resolver: GraphQLFieldResolver<any, any>, container: IOCContainer, roles: any[] | undefined): GraphQLFieldResolver<any, any>;
