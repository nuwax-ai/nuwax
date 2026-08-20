"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldMetadataFromObjectType = exports.getFieldMetadataFromInputType = void 0;
function getFieldMetadataFromInputType(type) {
    const fieldInfo = type.getFields();
    const typeFields = Object.keys(fieldInfo).reduce((fieldsMap, fieldName) => {
        const superField = fieldInfo[fieldName];
        fieldsMap[fieldName] = {
            type: superField.type,
            astNode: superField.astNode,
            description: superField.description,
            defaultValue: superField.defaultValue,
        };
        return fieldsMap;
    }, {});
    return typeFields;
}
exports.getFieldMetadataFromInputType = getFieldMetadataFromInputType;
function getFieldMetadataFromObjectType(type) {
    const fieldInfo = type.getFields();
    const typeFields = Object.keys(fieldInfo).reduce((fieldsMap, fieldName) => {
        const superField = fieldInfo[fieldName];
        fieldsMap[fieldName] = {
            type: superField.type,
            args: superField.args.reduce((argMap, { name, ...arg }) => {
                argMap[name] = arg;
                return argMap;
            }, {}),
            astNode: superField.astNode,
            resolve: superField.resolve,
            description: superField.description,
            deprecationReason: superField.deprecationReason,
            extensions: superField.extensions,
        };
        return fieldsMap;
    }, {});
    return typeFields;
}
exports.getFieldMetadataFromObjectType = getFieldMetadataFromObjectType;
