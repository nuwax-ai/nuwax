import { type GraphQLTypeResolver } from "graphql";
import { type ClassType, type Maybe, type MaybePromise } from "./utils/index.js";
export type TypeResolver<TSource, TContext> = (...args: Parameters<GraphQLTypeResolver<TSource, TContext>>) => MaybePromise<Maybe<string | ClassType>>;
