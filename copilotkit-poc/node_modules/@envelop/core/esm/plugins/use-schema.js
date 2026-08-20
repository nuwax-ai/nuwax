export const useSchema = (schema) => {
    return {
        onPluginInit({ setSchema }) {
            setSchema(schema);
        },
    };
};
export const useSchemaByContext = (schemaLoader) => {
    return {
        onEnveloped({ setSchema, context }) {
            setSchema(schemaLoader(context));
        },
    };
};
