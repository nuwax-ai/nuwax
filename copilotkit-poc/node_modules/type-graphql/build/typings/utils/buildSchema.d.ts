import { type GraphQLSchema } from "graphql";
import { type SchemaGeneratorOptions } from "../schema/schema-generator.js";
import { type NonEmptyArray } from "../typings/index.js";
import { type PrintSchemaOptions } from "./emitSchemaDefinitionFile.js";
type EmitSchemaFileOptions = {
    path?: string;
} & Partial<PrintSchemaOptions>;
export type BuildSchemaOptions = {
    /** Array of resolvers classes to resolver files */
    resolvers: NonEmptyArray<Function>;
    /**
     * Path to the file to where emit the schema
     * or config object with print schema options
     * or `true` for the default `./schema.graphql` one
     */
    emitSchemaFile?: string | boolean | EmitSchemaFileOptions;
} & Omit<SchemaGeneratorOptions, "resolvers">;
export declare function buildSchema(options: BuildSchemaOptions): Promise<GraphQLSchema>;
export declare function buildSchemaSync(options: BuildSchemaOptions): GraphQLSchema;
export {};
