import { GraphQLBoolean, GraphQLFloat, GraphQLList, GraphQLNonNull, GraphQLScalarType, GraphQLString, } from "graphql";
import { WrongNullableListOptionError } from "../errors/index.js";
import { GraphQLISODateTime } from "../scalars/index.js";
import { BuildContext } from "../schema/build-context.js";
function wrapTypeInNestedList(targetType, depth, nullable) {
    const targetTypeNonNull = nullable ? targetType : new GraphQLNonNull(targetType);
    if (depth === 0) {
        return targetType;
    }
    return wrapTypeInNestedList(new GraphQLList(targetTypeNonNull), depth - 1, nullable);
}
export function convertTypeIfScalar(type) {
    if (type instanceof GraphQLScalarType) {
        return type;
    }
    const scalarMap = BuildContext.scalarsMaps.find(it => it.type === type);
    if (scalarMap) {
        return scalarMap.scalar;
    }
    switch (type) {
        case String:
            return GraphQLString;
        case Boolean:
            return GraphQLBoolean;
        case Number:
            return GraphQLFloat;
        case Date:
            return GraphQLISODateTime;
        default:
            return undefined;
    }
}
export function wrapWithTypeOptions(target, propertyName, type, typeOptions, nullableByDefault) {
    if (!typeOptions.array &&
        (typeOptions.nullable === "items" || typeOptions.nullable === "itemsAndList")) {
        throw new WrongNullableListOptionError(target.name, propertyName, typeOptions.nullable);
    }
    let gqlType = type;
    if (typeOptions.array) {
        const isNullableArray = typeOptions.nullable === "items" ||
            typeOptions.nullable === "itemsAndList" ||
            (typeOptions.nullable === undefined && nullableByDefault === true);
        gqlType = wrapTypeInNestedList(gqlType, typeOptions.arrayDepth, isNullableArray);
    }
    if (typeOptions.nullable === false ||
        (typeOptions.nullable === undefined && nullableByDefault === false) ||
        typeOptions.nullable === "items") {
        gqlType = new GraphQLNonNull(gqlType);
    }
    return gqlType;
}
const simpleTypes = [String, Boolean, Number, Date, Array, Promise];
export function convertToType(Target, data) {
    if (data == null) {
        return data;
    }
    if (Target instanceof GraphQLScalarType) {
        return data;
    }
    if (simpleTypes.includes(data.constructor)) {
        return data;
    }
    if (data instanceof Target) {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(item => convertToType(Target, item));
    }
    return Object.assign(new Target(), data);
}
export function getEnumValuesMap(enumObject) {
    const enumKeys = Object.keys(enumObject).filter(key => Number.isNaN(parseInt(key, 10)));
    const enumMap = enumKeys.reduce((map, key) => {
        map[key] = enumObject[key];
        return map;
    }, {});
    return enumMap;
}
