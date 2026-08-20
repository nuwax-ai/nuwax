"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationError = void 0;
const graphql_1 = require("graphql");
class AuthenticationError extends graphql_1.GraphQLError {
    constructor(message = "Access denied! You need to be authenticated to perform this action!") {
        super(message, {
            extensions: {
                code: "UNAUTHENTICATED",
            },
        });
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AuthenticationError = AuthenticationError;
