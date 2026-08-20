"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLISODateTime = exports.GraphQLTimestamp = void 0;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./aliases"), exports);
var graphql_scalars_1 = require("graphql-scalars");
Object.defineProperty(exports, "GraphQLTimestamp", { enumerable: true, get: function () { return graphql_scalars_1.GraphQLTimestamp; } });
Object.defineProperty(exports, "GraphQLISODateTime", { enumerable: true, get: function () { return graphql_scalars_1.GraphQLDateTimeISO; } });
