import type { ASTNode, DirectiveNode, GraphQLSchema } from 'graphql';
export type DirectableASTNode = ASTNode & {
    directives?: readonly DirectiveNode[] | undefined;
};
export type DirectableObject = {
    astNode?: DirectableASTNode | null | undefined;
    extensionASTNodes?: readonly DirectableASTNode[] | null | undefined;
    extensions?: any;
};
export declare function getDirectiveExtensions<TDirectiveAnnotationsMap extends {
    [directiveName: string]: {
        [paramName: string]: any;
    };
}>(directableObj: DirectableObject, schema?: GraphQLSchema, pathToDirectivesInExtensions?: string[]): { [directiveName in keyof TDirectiveAnnotationsMap]?: TDirectiveAnnotationsMap[directiveName][] | undefined; };
