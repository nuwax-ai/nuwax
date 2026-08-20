"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSchemaByContext = exports.useSchema = void 0;
const useSchema = (schema) => {
    return {
        onPluginInit({ setSchema }) {
            setSchema(schema);
        },
    };
};
exports.useSchema = useSchema;
const useSchemaByContext = (schemaLoader) => {
    return {
        onEnveloped({ setSchema, context }) {
            setSchema(schemaLoader(context));
        },
    };
};
exports.useSchemaByContext = useSchemaByContext;
