import { isContentTypeMatch, parseURLSearchParams } from './utils.js';
export function isPOSTFormUrlEncodedRequest(request) {
    return (request.method === 'POST' && isContentTypeMatch(request, 'application/x-www-form-urlencoded'));
}
export function parsePOSTFormUrlEncodedRequest(request) {
    return request.text().then(parseURLSearchParams);
}
