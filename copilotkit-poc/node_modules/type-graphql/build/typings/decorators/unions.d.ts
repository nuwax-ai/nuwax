import { type UnionFromClasses } from "../helpers/utils.js";
import { type ClassType } from "../typings/index.js";
import { type ResolveTypeOptions } from "./types.js";
export type UnionTypeConfig<TClassTypes extends readonly ClassType[]> = {
    name: string;
    description?: string;
    types: () => TClassTypes;
} & ResolveTypeOptions<UnionFromClasses<TClassTypes>>;
export declare function createUnionType<T extends readonly ClassType[]>(config: UnionTypeConfig<T>): UnionFromClasses<T>;
