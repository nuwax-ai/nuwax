import { ASTNode, GraphQLError, Source } from 'graphql';
import { Maybe } from './types.cjs';
interface GraphQLErrorOptions {
    nodes?: ReadonlyArray<ASTNode> | ASTNode | null;
    source?: Maybe<Source>;
    positions?: Maybe<ReadonlyArray<number>>;
    path?: Maybe<ReadonlyArray<string | number>>;
    originalError?: Maybe<Error & {
        readonly extensions?: unknown;
    }>;
    extensions?: any;
    coordinate?: string;
}
declare module 'graphql' {
    interface GraphQLError {
        /**
         * An optional schema coordinate (e.g. "MyType.myField") associated with this error.
         */
        readonly coordinate?: string;
    }
}
export declare function isGraphQLErrorLike(error: any): boolean;
export declare function createGraphQLError(message: string, options?: GraphQLErrorOptions): GraphQLError;
type SchemaCoordinateInfo = {
    fieldName: string;
    parentType: {
        name: string;
    };
};
export declare function getSchemaCoordinate(error: GraphQLError): string | undefined;
export declare function locatedError(rawError: unknown, nodes: ASTNode | ReadonlyArray<ASTNode> | undefined, path: Maybe<ReadonlyArray<string | number>>, info?: SchemaCoordinateInfo | false | null | undefined): GraphQLError;
export declare function relocatedError(originalError: GraphQLError, path?: ReadonlyArray<string | number>, info?: SchemaCoordinateInfo | false | null | undefined): GraphQLError;
export {};
