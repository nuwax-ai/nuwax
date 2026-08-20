import { printSchema } from "graphql";
import { buildSchema, buildSchemaSync } from "./buildSchema.js";
import { createResolversMap } from "./createResolversMap.js";
function createTypeDefsAndResolversMap(schema) {
    const typeDefs = printSchema(schema);
    const resolvers = createResolversMap(schema);
    return { typeDefs, resolvers };
}
export async function buildTypeDefsAndResolvers(options) {
    const schema = await buildSchema(options);
    return createTypeDefsAndResolversMap(schema);
}
export function buildTypeDefsAndResolversSync(options) {
    const schema = buildSchemaSync(options);
    return createTypeDefsAndResolversMap(schema);
}
