import { Kind, parse, parseConstValue, } from "graphql";
import { InvalidDirectiveError } from "../errors/index.js";
export function getDirectiveNode(directive) {
    const nameOrDefinition = directive.nameOrDefinition.replaceAll("\n", " ").trimStart();
    const { args } = directive;
    if (nameOrDefinition === "") {
        throw new InvalidDirectiveError("Please pass at-least one directive name or definition to the @Directive decorator");
    }
    if (!nameOrDefinition.startsWith("@")) {
        return {
            kind: Kind.DIRECTIVE,
            name: {
                kind: Kind.NAME,
                value: nameOrDefinition,
            },
            arguments: Object.keys(args).map(argKey => ({
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: argKey,
                },
                value: parseConstValue(args[argKey]),
            })),
        };
    }
    let parsed;
    try {
        parsed = parse(`type String ${nameOrDefinition}`);
    }
    catch (err) {
        throw new InvalidDirectiveError(`Error parsing directive definition "${directive.nameOrDefinition}"`);
    }
    const definitions = parsed.definitions;
    const directives = definitions
        .filter((it) => !!it.directives && it.directives.length > 0)
        .map(it => it.directives)
        .flat();
    if (directives.length !== 1) {
        throw new InvalidDirectiveError(`Please pass only one directive name or definition at a time to the @Directive decorator "${directive.nameOrDefinition}"`);
    }
    return directives[0];
}
export function getObjectTypeDefinitionNode(name, directiveMetadata) {
    if (!directiveMetadata || !directiveMetadata.length) {
        return undefined;
    }
    return {
        kind: Kind.OBJECT_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: name,
        },
        directives: directiveMetadata.map(getDirectiveNode),
    };
}
export function getInputObjectTypeDefinitionNode(name, directiveMetadata) {
    if (!directiveMetadata || !directiveMetadata.length) {
        return undefined;
    }
    return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: name,
        },
        directives: directiveMetadata.map(getDirectiveNode),
    };
}
export function getFieldDefinitionNode(name, type, directiveMetadata) {
    if (!directiveMetadata || !directiveMetadata.length) {
        return undefined;
    }
    return {
        kind: Kind.FIELD_DEFINITION,
        type: {
            kind: Kind.NAMED_TYPE,
            name: {
                kind: Kind.NAME,
                value: type.toString(),
            },
        },
        name: {
            kind: Kind.NAME,
            value: name,
        },
        directives: directiveMetadata.map(getDirectiveNode),
    };
}
export function getInputValueDefinitionNode(name, type, directiveMetadata) {
    if (!directiveMetadata || !directiveMetadata.length) {
        return undefined;
    }
    return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        type: {
            kind: Kind.NAMED_TYPE,
            name: {
                kind: Kind.NAME,
                value: type.toString(),
            },
        },
        name: {
            kind: Kind.NAME,
            value: name,
        },
        directives: directiveMetadata.map(getDirectiveNode),
    };
}
export function getInterfaceTypeDefinitionNode(name, directiveMetadata) {
    if (!directiveMetadata || !directiveMetadata.length) {
        return undefined;
    }
    return {
        kind: Kind.INTERFACE_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: name,
        },
        directives: directiveMetadata.map(getDirectiveNode),
    };
}
