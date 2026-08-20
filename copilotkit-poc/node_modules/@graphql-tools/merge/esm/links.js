/**
 * A simplified, GraphQL v15 compatible version of
 * https://github.com/graphql-hive/federation-composition/blob/main/src/utils/link/index.ts
 * that does not provide the same safeguards or functionality, but still can determine the
 * correct name of an linked resource.
 */
import { Kind, } from 'graphql';
function namespace(link) {
    return link.as ?? link.url.name;
}
function defaultImport(link) {
    const name = namespace(link);
    return name && `@${name}`;
}
export function resolveImportName(link, elementName) {
    if (link.url.name && elementName === `@${link.url.name}`) {
        // @note: default is a directive... So remove the `@`
        return defaultImport(link).substring(1);
    }
    const imported = link.imports.find(i => i.name === elementName);
    const resolvedName = imported?.as ?? imported?.name ?? namespaced(namespace(link), elementName);
    // Strip the `@` prefix for directives because in all implementations of mapping or visiting a schema,
    // directive names are not prefixed with `@`. The `@` is only for SDL.
    return resolvedName.startsWith('@') ? resolvedName.substring(1) : resolvedName;
}
function namespaced(namespace, name) {
    if (namespace?.length) {
        if (name.startsWith('@')) {
            return `@${namespace}__${name.substring(1)}`;
        }
        return `${namespace}__${name}`;
    }
    return name;
}
export function extractLinks(typeDefs) {
    let links = [];
    for (const definition of typeDefs.definitions) {
        if (definition.kind === Kind.SCHEMA_EXTENSION || definition.kind === Kind.SCHEMA_DEFINITION) {
            const defLinks = definition.directives?.filter(directive => directive.name.value === 'link');
            const parsedLinks = defLinks?.map(l => linkFromArgs(l.arguments ?? [])).filter(l => l !== undefined) ?? [];
            links = links.concat(parsedLinks);
            // Federation 1 support... Federation 1 uses "@core" instead of "@link", but behavior is similar enough that
            //  it can be translated.
            const defCores = definition.directives?.filter(({ name }) => name.value === 'core');
            const coreLinks = defCores
                ?.map(c => linkFromCoreArgs(c.arguments ?? []))
                .filter(l => l !== undefined);
            if (coreLinks) {
                links = links.concat(...coreLinks);
            }
        }
    }
    return links;
}
function linkFromArgs(args) {
    let url;
    let imports = [];
    let as;
    for (const arg of args) {
        switch (arg.name.value) {
            case 'url': {
                if (arg.value.kind === Kind.STRING) {
                    url = parseFederationLinkUrl(arg.value.value);
                }
                break;
            }
            case 'import': {
                imports = parseImportNode(arg.value);
                break;
            }
            case 'as': {
                if (arg.value.kind === Kind.STRING) {
                    as = arg.value.value ?? undefined;
                }
                break;
            }
            default: {
                // ignore. It's not the job of this package to validate. Federation should validate links.
            }
        }
    }
    if (url !== undefined) {
        return {
            url,
            as,
            imports,
        };
    }
}
/**
 * Supports federation 1
 */
function linkFromCoreArgs(args) {
    const feature = args.find(({ name, value }) => name.value === 'feature' && value.kind === Kind.STRING);
    if (feature) {
        const url = parseFederationLinkUrl(feature.value.value);
        return {
            url,
            imports: [],
        };
    }
}
function parseImportNode(node) {
    if (node.kind === Kind.LIST) {
        const imports = node.values.map((v) => {
            let namedImport;
            if (v.kind === Kind.STRING) {
                namedImport = { name: v.value };
            }
            else if (v.kind === Kind.OBJECT) {
                let name = '';
                let as;
                for (const f of v.fields) {
                    if (f.name.value === 'name') {
                        if (f.value.kind === Kind.STRING) {
                            name = f.value.value;
                        }
                    }
                    else if (f.name.value === 'as') {
                        if (f.value.kind === Kind.STRING) {
                            as = f.value.value;
                        }
                    }
                }
                namedImport = { name, as };
            }
            return namedImport;
        });
        return imports.filter(i => i !== undefined);
    }
    return [];
}
const VERSION_MATCH = /v(\d{1,3})\.(\d{1,4})/i;
function parseFederationLinkUrl(urlSource) {
    const url = new URL(urlSource);
    const parts = url.pathname.split('/').filter(Boolean);
    const versionOrName = parts[parts.length - 1];
    if (versionOrName) {
        if (VERSION_MATCH.test(versionOrName)) {
            const maybeName = parts[parts.length - 2];
            return {
                identity: url.origin + (maybeName ? `/${parts.slice(0, parts.length - 1).join('/')}` : ''),
                name: maybeName ?? null,
                version: versionOrName,
            };
        }
        return {
            identity: `${url.origin}/${parts.join('/')}`,
            name: versionOrName,
            version: null,
        };
    }
    return {
        identity: url.origin,
        name: null,
        version: null,
    };
}
