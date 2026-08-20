import { CONTINUE, SKIP, visit } from "unist-util-visit";
export const BlockPolicy = {
    indicator: "indicator",
    textOnly: "text-only",
    remove: "remove",
};
export function harden({ defaultOrigin = "", allowedLinkPrefixes = [], allowedImagePrefixes = [], allowDataImages = false, allowedProtocols = [], blockedImageClass = "inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded text-sm", blockedLinkClass = "text-gray-500", linkBlockPolicy = BlockPolicy.indicator, imageBlockPolicy = BlockPolicy.indicator, }) {
    // Only require defaultOrigin if we have specific prefixes (not wildcard only)
    const hasSpecificLinkPrefixes = allowedLinkPrefixes.length && !allowedLinkPrefixes.every((p) => p === "*");
    const hasSpecificImagePrefixes = allowedImagePrefixes.length &&
        !allowedImagePrefixes.every((p) => p === "*");
    if (!defaultOrigin && (hasSpecificLinkPrefixes || hasSpecificImagePrefixes)) {
        throw new Error("defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided");
    }
    return (tree) => {
        const visitor = createVisitor(defaultOrigin, allowedLinkPrefixes, allowedImagePrefixes, allowDataImages, allowedProtocols, blockedImageClass, blockedLinkClass, linkBlockPolicy, imageBlockPolicy);
        // Strip null/undefined children before traversal to prevent
        // unist-util-visit from crashing on malformed ASTs (e.g. from
        // streaming markdown parsers). See vercel/streamdown#270.
        stripNullChildren(tree);
        visit(tree, visitor);
    };
}
function parseUrl(url, defaultOrigin) {
    if (typeof url !== "string")
        return null;
    try {
        // Try to parse as absolute URL first
        return new URL(url);
    }
    catch {
        // If that fails and we have a defaultOrigin, try with it
        if (defaultOrigin) {
            try {
                return new URL(url, defaultOrigin);
            }
            catch {
                return null;
            }
        }
        // For relative URLs without defaultOrigin, use a dummy base to parse them
        // This allows wildcard "*" to work with relative URLs
        if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
            try {
                return new URL(url, "http://example.com");
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
function isPathRelativeUrl(url) {
    if (typeof url !== "string")
        return false;
    return url.startsWith("/") || url.startsWith("./") || url.startsWith("../");
}
const safeProtocols = new Set([
    "https:",
    "http:",
    "irc:",
    "ircs:",
    "mailto:",
    "xmpp:",
    "blob:",
]);
// Protocols that should NEVER be allowed for security reasons
const blockedProtocols = new Set([
    "javascript:",
    "data:",
    "file:",
    "vbscript:",
]);
function transformUrl(url, allowedPrefixes, defaultOrigin, allowDataImages = false, isImage = false, allowedProtocols = []) {
    if (!url)
        return null;
    // Allow hash-only (fragment-only) URLs - they navigate within the current page
    if (typeof url === "string" && url.startsWith("#") && !isImage) {
        // Hash-only URLs don't need defaultOrigin validation
        // Just verify it's a valid fragment identifier
        try {
            // Use a dummy base to validate the hash format
            const testUrl = new URL(url, "http://example.com");
            if (testUrl.hash === url) {
                return url;
            }
        }
        catch {
            // Invalid hash format, fall through to normal validation
        }
    }
    // Handle data: URLs for images if allowDataImages is enabled
    if (typeof url === "string" && url.startsWith("data:")) {
        // Only allow data: URLs for images when explicitly enabled
        if (isImage && allowDataImages && url.startsWith("data:image/")) {
            return url;
        }
        return null;
    }
    // Handle blob: URLs - these are browser-generated URLs for local objects
    if (typeof url === "string" && url.startsWith("blob:")) {
        // blob: URLs are valid and safe - they reference in-memory objects
        // They can only reference content already loaded in the browser
        try {
            // Validate it's a properly formatted blob URL
            // blob: URLs should have the format: blob:<origin>/<uuid> or blob:null/<uuid>
            const blobUrl = new URL(url);
            if (blobUrl.protocol === "blob:" && url.length > 5) {
                // Ensure there's actual content after "blob:"
                const afterProtocol = url.substring(5);
                if (afterProtocol && afterProtocol.length > 0 && afterProtocol !== "invalid") {
                    return url;
                }
            }
        }
        catch {
            return null;
        }
        // If we get here, the blob URL is malformed
        return null;
    }
    const parsedUrl = parseUrl(url, defaultOrigin);
    if (!parsedUrl)
        return null;
    // Block dangerous protocols - these should NEVER be allowed
    // Exception: data: is allowed for images if allowDataImages is true (handled above)
    if (blockedProtocols.has(parsedUrl.protocol)) {
        return null;
    }
    // Check if protocol is allowed
    const isProtocolAllowed = safeProtocols.has(parsedUrl.protocol) ||
        allowedProtocols.includes(parsedUrl.protocol) ||
        allowedProtocols.includes("*");
    if (!isProtocolAllowed)
        return null;
    // mailto: and other custom protocols can just return as-is
    if (parsedUrl.protocol === "mailto:" || !parsedUrl.protocol.match(/^https?:$/)) {
        return parsedUrl.href;
    }
    // If the input is path relative, we output a path relative URL as well,
    // however, we always run the same checks on an absolute URL and we
    // always reconstruct the output from the parsed URL to ensure that
    // the output is always a valid URL.
    const inputWasRelative = isPathRelativeUrl(url);
    if (parsedUrl &&
        allowedPrefixes.some((prefix) => {
            const parsedPrefix = parseUrl(prefix, defaultOrigin);
            if (!parsedPrefix) {
                return false;
            }
            if (parsedPrefix.origin !== parsedUrl.origin) {
                return false;
            }
            return parsedUrl.href.startsWith(parsedPrefix.href);
        })) {
        if (inputWasRelative) {
            return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
        }
        return parsedUrl.href;
    }
    // Check for wildcard - allow all URLs
    if (allowedPrefixes.includes("*")) {
        // Wildcard only allows http and https URLs
        if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
            return null;
        }
        if (inputWasRelative) {
            return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
        }
        return parsedUrl.href;
    }
    return null;
}
function stripNullChildren(node) {
    if ("children" in node && Array.isArray(node.children)) {
        node.children = node.children.filter((child) => child != null);
        for (const child of node.children) {
            stripNullChildren(child);
        }
    }
}
const SEEN = Symbol("node-seen");
function resolveLinkBlockPolicy(node, policy, blockedLinkClass) {
    if (policy === BlockPolicy.remove) {
        return { type: "remove" };
    }
    if (policy === BlockPolicy.textOnly) {
        return {
            type: "replace",
            element: {
                type: "element",
                tagName: "span",
                properties: {},
                children: [...node.children],
            },
        };
    }
    // "indicator" - default behavior
    return {
        type: "replace",
        element: {
            type: "element",
            tagName: "span",
            properties: {
                title: "Blocked URL: " + String(node.properties.href),
                class: blockedLinkClass,
            },
            children: [
                ...node.children,
                {
                    type: "text",
                    value: " [blocked]",
                },
            ],
        },
    };
}
function resolveImageBlockPolicy(node, policy, blockedImageClass) {
    if (policy === BlockPolicy.remove) {
        return { type: "remove" };
    }
    if (policy === BlockPolicy.textOnly) {
        const altText = String(node.properties.alt || "");
        if (!altText) {
            return { type: "remove" };
        }
        return {
            type: "replace",
            element: {
                type: "element",
                tagName: "span",
                properties: {},
                children: [{ type: "text", value: altText }],
            },
        };
    }
    // "indicator" - default behavior
    return {
        type: "replace",
        element: {
            type: "element",
            tagName: "span",
            properties: {
                class: blockedImageClass,
            },
            children: [
                {
                    type: "text",
                    value: "[Image blocked: " +
                        String(node.properties.alt || "No description") +
                        "]",
                },
            ],
        },
    };
}
const createVisitor = (defaultOrigin, allowedLinkPrefixes, allowedImagePrefixes, allowDataImages, allowedProtocols, blockedImageClass, blockedLinkClass, linkBlockPolicy, imageBlockPolicy) => {
    const visitor = (node, index, parent) => {
        if (node.type !== "element" ||
            // @ts-expect-error
            node[SEEN]) {
            return CONTINUE;
        }
        if (node.tagName === "a") {
            const transformedUrl = transformUrl(node.properties.href, allowedLinkPrefixes, defaultOrigin, false, false, allowedProtocols);
            if (transformedUrl === null) {
                // @ts-expect-error
                node[SEEN] = true;
                // We need to eagerly visit children so that we catch any nested nastiness as well,
                // prior to modifying the node's parent.
                visit(node, visitor);
                if (parent && typeof index === "number") {
                    const result = resolveLinkBlockPolicy(node, linkBlockPolicy, blockedLinkClass);
                    if (result.type === "remove") {
                        parent.children.splice(index, 1);
                        return [SKIP, index];
                    }
                    parent.children[index] = result.element;
                }
                return SKIP;
            }
            else {
                node.properties.href = transformedUrl;
                node.properties.target = "_blank";
                node.properties.rel = "noopener noreferrer";
                return CONTINUE;
            }
        }
        if (node.tagName === "img") {
            const transformedUrl = transformUrl(node.properties.src, allowedImagePrefixes, defaultOrigin, allowDataImages, true, allowedProtocols);
            if (transformedUrl === null) {
                // @ts-expect-error
                node[SEEN] = true;
                visit(node, visitor);
                if (parent && typeof index === "number") {
                    const result = resolveImageBlockPolicy(node, imageBlockPolicy, blockedImageClass);
                    if (result.type === "remove") {
                        parent.children.splice(index, 1);
                        return [SKIP, index];
                    }
                    parent.children[index] = result.element;
                }
                return SKIP;
            }
            else {
                node.properties.src = transformedUrl;
                return CONTINUE;
            }
        }
        return CONTINUE;
    };
    return visitor;
};
//# sourceMappingURL=index.js.map