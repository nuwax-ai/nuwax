import { makeExecutableSchema } from '@graphql-tools/schema';
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function createSchema(opts) {
    return makeExecutableSchema(opts);
}
