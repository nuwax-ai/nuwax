"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationError = void 0;
const graphql_1 = require("graphql");
class AuthorizationError extends graphql_1.GraphQLError {
    constructor(message = "Access denied! You don't have permission for this action!") {
        super(message, {
            extensions: {
                code: "UNAUTHORIZED",
            },
        });
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AuthorizationError = AuthorizationError;
