import { type BuildSchemaOptions } from "./buildSchema.js";
export declare function buildTypeDefsAndResolvers(options: BuildSchemaOptions): Promise<{
    typeDefs: string;
    resolvers: import("..").ResolversMap;
}>;
export declare function buildTypeDefsAndResolversSync(options: BuildSchemaOptions): {
    typeDefs: string;
    resolvers: import("..").ResolversMap;
};
