"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useContentEncoding = useContentEncoding;
const utils_js_1 = require("../utils.js");
const emptyEncodings = ['none', 'identity'];
function useContentEncoding() {
    return {
        onRequest({ request, setRequest, fetchAPI, endResponse }) {
            const contentEncodingHeader = request.headers.get('content-encoding');
            if (contentEncodingHeader &&
                contentEncodingHeader !== 'none' &&
                contentEncodingHeader !== 'identity' &&
                request.body) {
                const contentEncodings = contentEncodingHeader
                    .split(',')
                    .filter(encoding => !emptyEncodings.includes(encoding));
                if (contentEncodings.length) {
                    if (!contentEncodings.every(encoding => (0, utils_js_1.getSupportedEncodings)(fetchAPI).includes(encoding))) {
                        endResponse(new fetchAPI.Response(`Unsupported 'Content-Encoding': ${contentEncodingHeader}`, {
                            status: 415,
                            statusText: 'Unsupported Media Type',
                        }));
                        return;
                    }
                    let newBody = request.body;
                    for (const contentEncoding of contentEncodings) {
                        newBody = request.body.pipeThrough(new fetchAPI.DecompressionStream(contentEncoding));
                    }
                    setRequest(new fetchAPI.Request(request.url, {
                        body: newBody,
                        cache: request.cache,
                        credentials: request.credentials,
                        headers: request.headers,
                        integrity: request.integrity,
                        keepalive: request.keepalive,
                        method: request.method,
                        mode: request.mode,
                        redirect: request.redirect,
                        referrer: request.referrer,
                        referrerPolicy: request.referrerPolicy,
                        signal: request.signal,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore - not in the TS types yet
                        duplex: 'half',
                    }));
                }
            }
        },
        onResponse({ request, response, setResponse, fetchAPI }) {
            const acceptEncoding = request.headers.get('accept-encoding');
            if (acceptEncoding) {
                const encodings = acceptEncoding.split(',');
                if (encodings.length && response.body) {
                    const supportedEncoding = encodings.find(encoding => (0, utils_js_1.getSupportedEncodings)(fetchAPI).includes(encoding));
                    if (supportedEncoding) {
                        const compressionStream = new fetchAPI.CompressionStream(supportedEncoding);
                        const newHeaders = new fetchAPI.Headers(response.headers);
                        newHeaders.set('content-encoding', supportedEncoding);
                        newHeaders.delete('content-length');
                        const compressedBody = response.body.pipeThrough(compressionStream);
                        const compressedResponse = new fetchAPI.Response(compressedBody, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: newHeaders,
                        });
                        utils_js_1.decompressedResponseMap.set(compressedResponse, response);
                        setResponse(compressedResponse);
                    }
                }
            }
        },
    };
}
