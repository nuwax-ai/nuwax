import path from "node:path";
import { SchemaGenerator } from "../schema/schema-generator.js";
import { defaultPrintSchemaOptions, emitSchemaDefinitionFile, emitSchemaDefinitionFileSync, } from "./emitSchemaDefinitionFile.js";
function getEmitSchemaDefinitionFileOptions(buildSchemaOptions) {
    const defaultSchemaFilePath = path.resolve(process.cwd(), "schema.graphql");
    return {
        schemaFileName: typeof buildSchemaOptions.emitSchemaFile === "string"
            ? buildSchemaOptions.emitSchemaFile
            : typeof buildSchemaOptions.emitSchemaFile === "object"
                ? buildSchemaOptions.emitSchemaFile.path || defaultSchemaFilePath
                : defaultSchemaFilePath,
        printSchemaOptions: typeof buildSchemaOptions.emitSchemaFile === "object"
            ? { ...defaultPrintSchemaOptions, ...buildSchemaOptions.emitSchemaFile }
            : defaultPrintSchemaOptions,
    };
}
function loadResolvers(options) {
    if (options.resolvers.length === 0) {
        throw new Error("Empty `resolvers` array property found in `buildSchema` options!");
    }
    return options.resolvers;
}
export async function buildSchema(options) {
    const resolvers = loadResolvers(options);
    const schema = SchemaGenerator.generateFromMetadata({ ...options, resolvers });
    if (options.emitSchemaFile) {
        const { schemaFileName, printSchemaOptions } = getEmitSchemaDefinitionFileOptions(options);
        await emitSchemaDefinitionFile(schemaFileName, schema, printSchemaOptions);
    }
    return schema;
}
export function buildSchemaSync(options) {
    const resolvers = loadResolvers(options);
    const schema = SchemaGenerator.generateFromMetadata({ ...options, resolvers });
    if (options.emitSchemaFile) {
        const { schemaFileName, printSchemaOptions } = getEmitSchemaDefinitionFileOptions(options);
        emitSchemaDefinitionFileSync(schemaFileName, schema, printSchemaOptions);
    }
    return schema;
}
