import { type GraphQLFieldConfigMap, type GraphQLInputFieldConfigMap, type GraphQLInputObjectType, type GraphQLInterfaceType, type GraphQLObjectType } from "graphql";
export declare function getFieldMetadataFromInputType(type: GraphQLInputObjectType): GraphQLInputFieldConfigMap;
export declare function getFieldMetadataFromObjectType(type: GraphQLObjectType | GraphQLInterfaceType): GraphQLFieldConfigMap<any, any>;
