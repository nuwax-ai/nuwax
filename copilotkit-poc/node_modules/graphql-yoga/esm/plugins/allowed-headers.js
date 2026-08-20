export function useAllowedResponseHeaders(allowedHeaders) {
    return {
        onResponse({ response }) {
            removeDisallowedHeaders(response.headers, allowedHeaders);
        },
    };
}
export function useAllowedRequestHeaders(allowedHeaders) {
    return {
        onRequest({ request }) {
            removeDisallowedHeaders(request.headers, allowedHeaders);
        },
    };
}
function removeDisallowedHeaders(headers, allowedHeaders) {
    for (const headerName of headers.keys()) {
        if (!allowedHeaders.includes(headerName)) {
            headers.delete(headerName);
        }
    }
}
