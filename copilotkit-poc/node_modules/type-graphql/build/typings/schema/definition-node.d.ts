import { type ConstDirectiveNode, type FieldDefinitionNode, type GraphQLInputType, type GraphQLOutputType, type InputObjectTypeDefinitionNode, type InputValueDefinitionNode, type InterfaceTypeDefinitionNode, type ObjectTypeDefinitionNode } from "graphql";
import { type DirectiveMetadata } from "../metadata/definitions/index.js";
export declare function getDirectiveNode(directive: DirectiveMetadata): ConstDirectiveNode;
export declare function getObjectTypeDefinitionNode(name: string, directiveMetadata?: DirectiveMetadata[]): ObjectTypeDefinitionNode | undefined;
export declare function getInputObjectTypeDefinitionNode(name: string, directiveMetadata?: DirectiveMetadata[]): InputObjectTypeDefinitionNode | undefined;
export declare function getFieldDefinitionNode(name: string, type: GraphQLOutputType, directiveMetadata?: DirectiveMetadata[]): FieldDefinitionNode | undefined;
export declare function getInputValueDefinitionNode(name: string, type: GraphQLInputType, directiveMetadata?: DirectiveMetadata[]): InputValueDefinitionNode | undefined;
export declare function getInterfaceTypeDefinitionNode(name: string, directiveMetadata?: DirectiveMetadata[]): InterfaceTypeDefinitionNode | undefined;
