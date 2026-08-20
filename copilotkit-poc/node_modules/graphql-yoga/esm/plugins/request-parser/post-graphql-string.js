import { isContentTypeMatch } from './utils.js';
export function isPOSTGraphQLStringRequest(request) {
    return request.method === 'POST' && isContentTypeMatch(request, 'application/graphql');
}
export function parsePOSTGraphQLStringRequest(request) {
    return request.text().then(query => ({ query }));
}
