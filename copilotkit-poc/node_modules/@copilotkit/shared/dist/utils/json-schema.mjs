import { z } from "zod";

//#region src/utils/json-schema.ts
function actionParametersToJsonSchema(actionParameters) {
	let parameters = {};
	for (let parameter of actionParameters || []) parameters[parameter.name] = convertAttribute(parameter);
	let requiredParameterNames = [];
	for (let arg of actionParameters || []) if (arg.required !== false) requiredParameterNames.push(arg.name);
	return {
		type: "object",
		properties: parameters,
		required: requiredParameterNames
	};
}
function jsonSchemaToActionParameters(jsonSchema) {
	if (jsonSchema.type !== "object" || !jsonSchema.properties) return [];
	const parameters = [];
	const requiredFields = jsonSchema.required || [];
	for (const [name, schema] of Object.entries(jsonSchema.properties)) {
		const parameter = convertJsonSchemaToParameter(name, schema, requiredFields.includes(name));
		parameters.push(parameter);
	}
	return parameters;
}
function convertJsonSchemaToParameter(name, schema, isRequired) {
	const baseParameter = {
		name,
		description: schema.description
	};
	if (!isRequired) baseParameter.required = false;
	if (Array.isArray(schema.type)) {
		const types = schema.type;
		const hasNull = types.includes("null");
		const nonNullTypes = types.filter((t) => t !== "null");
		const resolvedType = nonNullTypes.length > 0 ? nonNullTypes[0] : "string";
		return convertJsonSchemaToParameter(name, {
			...schema,
			type: resolvedType
		}, hasNull ? false : isRequired);
	}
	switch (schema.type) {
		case "string": return {
			...baseParameter,
			type: "string",
			...schema.enum && { enum: schema.enum }
		};
		case "number":
		case "boolean": return {
			...baseParameter,
			type: schema.type
		};
		case "object":
			if (schema.properties) {
				const attributes = [];
				const requiredFields = schema.required || [];
				for (const [propName, propSchema] of Object.entries(schema.properties)) attributes.push(convertJsonSchemaToParameter(propName, propSchema, requiredFields.includes(propName)));
				return {
					...baseParameter,
					type: "object",
					attributes
				};
			}
			return {
				...baseParameter,
				type: "object"
			};
		case "array": if (schema.items.type === "object" && "properties" in schema.items) {
			const attributes = [];
			const requiredFields = schema.items.required || [];
			for (const [propName, propSchema] of Object.entries(schema.items.properties || {})) attributes.push(convertJsonSchemaToParameter(propName, propSchema, requiredFields.includes(propName)));
			return {
				...baseParameter,
				type: "object[]",
				attributes
			};
		} else if (schema.items.type === "array") throw new Error("Nested arrays are not supported");
		else return {
			...baseParameter,
			type: `${schema.items.type}[]`
		};
		default: return {
			...baseParameter,
			type: "string"
		};
	}
}
function convertAttribute(attribute) {
	switch (attribute.type) {
		case "string": return {
			type: "string",
			description: attribute.description,
			...attribute.enum && { enum: attribute.enum }
		};
		case "number":
		case "boolean": return {
			type: attribute.type,
			description: attribute.description
		};
		case "object":
		case "object[]":
			const properties = attribute.attributes?.reduce((acc, attr) => {
				acc[attr.name] = convertAttribute(attr);
				return acc;
			}, {});
			const required = attribute.attributes?.filter((attr) => attr.required !== false).map((attr) => attr.name);
			if (attribute.type === "object[]") return {
				type: "array",
				items: {
					type: "object",
					...properties && { properties },
					...required && required.length > 0 && { required }
				},
				description: attribute.description
			};
			return {
				type: "object",
				description: attribute.description,
				...properties && { properties },
				...required && required.length > 0 && { required }
			};
		default:
			if (attribute.type?.endsWith("[]")) return {
				type: "array",
				items: { type: attribute.type.slice(0, -2) },
				description: attribute.description
			};
			return {
				type: "string",
				description: attribute.description
			};
	}
}
function convertJsonSchemaToZodSchema(jsonSchema, required, definitions, visitedRefs) {
	if (jsonSchema.$ref && definitions) {
		const refPath = jsonSchema.$ref.replace(/^#\/\$defs\/|^#\/definitions\//, "");
		const refs = visitedRefs ?? /* @__PURE__ */ new Set();
		if (refs.has(refPath)) {
			console.warn(`[CopilotKit] Circular $ref detected for "${refPath}" — falling back to z.any()`);
			let schema = z.any();
			if (jsonSchema.description) schema = schema.describe(jsonSchema.description);
			return required ? schema : schema.optional();
		}
		const resolved = definitions[refPath];
		if (resolved) {
			const nextRefs = new Set(refs);
			nextRefs.add(refPath);
			return convertJsonSchemaToZodSchema(resolved, required, definitions, nextRefs);
		}
	}
	const defs = definitions ?? jsonSchema.$defs ?? jsonSchema.definitions;
	if (Array.isArray(jsonSchema.type)) {
		const types = jsonSchema.type;
		const hasNull = types.includes("null");
		const nonNullTypes = types.filter((t) => t !== "null");
		const resolvedType = nonNullTypes.length > 0 ? nonNullTypes[0] : "string";
		const innerSchema = convertJsonSchemaToZodSchema({
			...jsonSchema,
			type: resolvedType
		}, true, defs, visitedRefs);
		let schema = hasNull ? z.union([innerSchema, z.null()]) : innerSchema;
		if (jsonSchema.description) schema = schema.describe(jsonSchema.description);
		return required ? schema : schema.optional();
	}
	const unionVariants = jsonSchema.anyOf ?? jsonSchema.oneOf;
	if (Array.isArray(unionVariants) && unionVariants.length > 0) {
		if (unionVariants.length === 1) return convertJsonSchemaToZodSchema(unionVariants[0], required, defs, visitedRefs);
		const schemas = unionVariants.map((v) => convertJsonSchemaToZodSchema(v, true, defs, visitedRefs));
		let schema = z.union(schemas);
		if (jsonSchema.description) schema = schema.describe(jsonSchema.description);
		return required ? schema : schema.optional();
	}
	if (jsonSchema.type === "object") {
		const spec = {};
		if (!jsonSchema.properties || !Object.keys(jsonSchema.properties).length) return !required ? z.object(spec).optional() : z.object(spec);
		for (const [key, value] of Object.entries(jsonSchema.properties)) spec[key] = convertJsonSchemaToZodSchema(value, jsonSchema.required ? jsonSchema.required.includes(key) : false, defs, visitedRefs);
		let schema = z.object(spec).describe(jsonSchema.description);
		return required ? schema : schema.optional();
	} else if (jsonSchema.type === "string") {
		if (jsonSchema.enum && jsonSchema.enum.length > 0) {
			let schema = z.enum(jsonSchema.enum).describe(jsonSchema.description);
			return required ? schema : schema.optional();
		}
		let schema = z.string().describe(jsonSchema.description);
		return required ? schema : schema.optional();
	} else if (jsonSchema.type === "number" || jsonSchema.type === "integer") {
		let schema = z.number().describe(jsonSchema.description);
		return required ? schema : schema.optional();
	} else if (jsonSchema.type === "boolean") {
		let schema = z.boolean().describe(jsonSchema.description);
		return required ? schema : schema.optional();
	} else if (jsonSchema.type === "array") {
		let itemSchema = convertJsonSchemaToZodSchema(jsonSchema.items, true, defs, visitedRefs);
		let schema = z.array(itemSchema).describe(jsonSchema.description);
		return required ? schema : schema.optional();
	} else if (jsonSchema.type === "null") {
		let schema = z.null().describe(jsonSchema.description);
		return required ? schema : schema.optional();
	}
	console.warn(`[CopilotKit] Unsupported JSON schema type "${jsonSchema.type ?? "unknown"}" — falling back to z.any()`);
	let schema = z.any();
	if (jsonSchema.description) schema = schema.describe(jsonSchema.description);
	return required ? schema : schema.optional();
}
function getZodParameters(parameters) {
	if (!parameters) return z.object({});
	return convertJsonSchemaToZodSchema(actionParametersToJsonSchema(parameters), true);
}

//#endregion
export { actionParametersToJsonSchema, convertJsonSchemaToZodSchema, getZodParameters, jsonSchemaToActionParameters };
//# sourceMappingURL=json-schema.mjs.map