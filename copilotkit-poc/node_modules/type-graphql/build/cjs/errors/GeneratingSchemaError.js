"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratingSchemaError = void 0;
class GeneratingSchemaError extends Error {
    constructor(details) {
        let errorMessage = "Some errors occurred while generating GraphQL schema:\n";
        errorMessage += details.map(it => `  ${it.message}\n`);
        errorMessage += "Please check the `details` property of the error to get more detailed info.";
        super(errorMessage);
        Object.setPrototypeOf(this, new.target.prototype);
        this.details = details;
    }
}
exports.GeneratingSchemaError = GeneratingSchemaError;
