"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchema = createSchema;
const schema_1 = require("@graphql-tools/schema");
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function createSchema(opts) {
    return (0, schema_1.makeExecutableSchema)(opts);
}
