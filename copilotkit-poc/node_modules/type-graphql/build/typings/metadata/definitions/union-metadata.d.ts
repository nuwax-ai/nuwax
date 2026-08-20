import { type ClassType, type TypeResolver } from "../../typings/index.js";
export interface UnionMetadata {
    getClassTypes: () => ClassType[];
    name: string;
    description?: string;
    resolveType?: TypeResolver<any, any>;
}
export type UnionMetadataWithSymbol = {
    symbol: symbol;
} & UnionMetadata;
