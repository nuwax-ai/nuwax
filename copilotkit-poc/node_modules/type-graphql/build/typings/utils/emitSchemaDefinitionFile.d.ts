import { type GraphQLSchema } from "graphql";
export interface PrintSchemaOptions {
    sortedSchema: boolean;
}
export declare const defaultPrintSchemaOptions: PrintSchemaOptions;
export declare function emitSchemaDefinitionFileSync(schemaFilePath: string, schema: GraphQLSchema, options?: PrintSchemaOptions): void;
export declare function emitSchemaDefinitionFile(schemaFilePath: string, schema: GraphQLSchema, options?: PrintSchemaOptions): Promise<void>;
