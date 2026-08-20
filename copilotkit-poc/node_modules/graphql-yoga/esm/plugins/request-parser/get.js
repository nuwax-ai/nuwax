import { URLSearchParams } from '@whatwg-node/fetch';
import { handleURLSearchParams } from './utils.js';
export function isGETRequest(request) {
    return request.method === 'GET';
}
export function parseGETRequest(request) {
    const queryString = request.url.substring(request.url.indexOf('?') + 1);
    const searchParams = new URLSearchParams(queryString);
    return handleURLSearchParams(searchParams);
}
