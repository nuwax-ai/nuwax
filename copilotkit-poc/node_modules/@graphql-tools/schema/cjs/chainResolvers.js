"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainResolvers = chainResolvers;
const graphql_1 = require("graphql");
function chainResolvers(resolvers) {
    return (root, args, ctx, info) => resolvers.reduce((prev, curResolver) => {
        if (curResolver != null) {
            return curResolver(prev, args, ctx, info);
        }
        return (0, graphql_1.defaultFieldResolver)(prev, args, ctx, info);
    }, root);
}
