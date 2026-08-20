function extractStringNodes(data, options) {
    const parsedOptions = { ...options, maxDepth: options.maxDepth ?? 10 };
    const queue = [[data, 0, "", null, ""]];
    let nextId = 0;
    const result = [];
    while (queue.length > 0) {
        const task = queue.shift();
        if (task == null)
            continue;
        const [value, depth, path, parent, key] = task;
        if (typeof value === "string") {
            result.push({
                value,
                path,
                parent: parent,
                key,
                _id: nextId++,
            });
        }
        else if (Array.isArray(value)) {
            if (depth >= parsedOptions.maxDepth)
                continue;
            for (let i = 0; i < value.length; i++) {
                queue.push([
                    value[i],
                    depth + 1,
                    `${path}[${i}]`,
                    value,
                    String(i),
                ]);
            }
        }
        else if (typeof value === "object" && value != null) {
            if (depth >= parsedOptions.maxDepth)
                continue;
            for (const [k, nestedValue] of Object.entries(value)) {
                queue.push([
                    nestedValue,
                    depth + 1,
                    path ? `${path}.${k}` : k,
                    value,
                    k,
                ]);
            }
        }
    }
    return result;
}
function deepClone(data) {
    return JSON.parse(JSON.stringify(data));
}
export function createAnonymizer(replacer, options) {
    return (data) => {
        let mutateValue = deepClone(data);
        const nodes = extractStringNodes(mutateValue, {
            maxDepth: options?.maxDepth,
        });
        const processor = Array.isArray(replacer)
            ? (() => {
                const replacers = replacer.map(({ pattern, type, replace }) => {
                    if (type != null && type !== "pattern")
                        throw new Error("Invalid anonymizer type");
                    return [
                        typeof pattern === "string"
                            ? new RegExp(pattern, "g")
                            : pattern,
                        replace ?? "[redacted]",
                    ];
                });
                if (replacers.length === 0)
                    throw new Error("No replacers provided");
                return {
                    maskNodes: (nodes) => {
                        return nodes.reduce((memo, item) => {
                            const newValue = replacers.reduce((value, [regex, replace]) => {
                                const result = value.replace(regex, replace);
                                // make sure we reset the state of regex
                                regex.lastIndex = 0;
                                return result;
                            }, item.value);
                            if (newValue !== item.value) {
                                memo.push({ ...item, value: newValue });
                            }
                            return memo;
                        }, []);
                    },
                };
            })()
            : typeof replacer === "function"
                ? {
                    maskNodes: (nodes) => nodes.reduce((memo, item) => {
                        const newValue = replacer(item.value, item.path);
                        if (newValue !== item.value) {
                            memo.push({ ...item, value: newValue });
                        }
                        return memo;
                    }, []),
                }
                : replacer;
        // Build a lookup from _id to internal node for direct write-back.
        const nodesById = new Map();
        for (const node of nodes) {
            nodesById.set(node._id, node);
        }
        const toUpdate = processor.maskNodes(nodes);
        for (const node of toUpdate) {
            if (node.path === "") {
                mutateValue = node.value;
            }
            else {
                // Match by _id if available (built-in replacers propagate it from
                // the input nodes), otherwise fall back to path matching.
                const asInternal = node;
                const internal = asInternal._id !== undefined
                    ? nodesById.get(asInternal._id)
                    : nodes.find((n) => n.path === node.path);
                if (internal) {
                    internal.parent[internal.key] = node.value;
                }
            }
        }
        return mutateValue;
    };
}
