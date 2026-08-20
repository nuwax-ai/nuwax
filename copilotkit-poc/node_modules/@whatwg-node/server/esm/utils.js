import { createDeferredPromise, fakePromise, handleMaybePromise, isPromise, } from '@whatwg-node/promise-helpers';
export { isPromise, createDeferredPromise };
export function isAsyncIterable(body) {
    return (body != null && typeof body === 'object' && typeof body[Symbol.asyncIterator] === 'function');
}
function getPort(nodeRequest) {
    if (nodeRequest.socket?.localPort) {
        return nodeRequest.socket?.localPort;
    }
    const hostInHeader = nodeRequest.headers?.[':authority'] || nodeRequest.headers?.host;
    const portInHeader = hostInHeader?.split(':')?.[1];
    if (portInHeader) {
        return portInHeader;
    }
    return 80;
}
function getHostnameWithPort(nodeRequest) {
    if (nodeRequest.headers?.[':authority']) {
        return nodeRequest.headers?.[':authority'];
    }
    if (nodeRequest.headers?.host) {
        return nodeRequest.headers?.host;
    }
    const port = getPort(nodeRequest);
    if (nodeRequest.hostname) {
        return nodeRequest.hostname + ':' + port;
    }
    const localIp = nodeRequest.socket?.localAddress;
    if (localIp && !localIp?.includes('::') && !localIp?.includes('ffff')) {
        return `${localIp}:${port}`;
    }
    return 'localhost';
}
function buildFullUrl(nodeRequest) {
    const hostnameWithPort = getHostnameWithPort(nodeRequest);
    const protocol = nodeRequest.protocol || (nodeRequest.socket?.encrypted ? 'https' : 'http');
    const endpoint = nodeRequest.originalUrl || nodeRequest.url || '/graphql';
    return `${protocol}://${hostnameWithPort}${endpoint}`;
}
function isRequestBody(body) {
    const stringTag = body[Symbol.toStringTag];
    if (typeof body === 'string' ||
        stringTag === 'Uint8Array' ||
        stringTag === 'Blob' ||
        stringTag === 'FormData' ||
        stringTag === 'URLSearchParams' ||
        isAsyncIterable(body)) {
        return true;
    }
    return false;
}
export function normalizeNodeRequest(nodeRequest, fetchAPI, nodeResponse, __useCustomAbortCtrl) {
    const rawRequest = nodeRequest.raw || nodeRequest.req || nodeRequest;
    let fullUrl = buildFullUrl(rawRequest);
    if (nodeRequest.query) {
        const url = new fetchAPI.URL(fullUrl);
        for (const key in nodeRequest.query) {
            url.searchParams.set(key, nodeRequest.query[key]);
        }
        fullUrl = url.toString();
    }
    let normalizedHeaders = nodeRequest.headers;
    if (nodeRequest.headers?.[':method']) {
        normalizedHeaders = {};
        for (const key in nodeRequest.headers) {
            if (!key.startsWith(':')) {
                normalizedHeaders[key] = nodeRequest.headers[key];
            }
        }
    }
    const controller = __useCustomAbortCtrl
        ? createCustomAbortControllerSignal()
        : new AbortController();
    if (nodeResponse?.once) {
        const closeEventListener = () => {
            if (!controller.signal.aborted) {
                Object.defineProperty(rawRequest, 'aborted', { value: true });
                controller.abort(nodeResponse.errored ?? undefined);
            }
        };
        nodeResponse.once('error', closeEventListener);
        nodeResponse.once('close', closeEventListener);
        nodeResponse.once('finish', () => {
            nodeResponse.removeListener('close', closeEventListener);
        });
    }
    if (nodeRequest.method === 'GET' || nodeRequest.method === 'HEAD') {
        return new fetchAPI.Request(fullUrl, {
            method: nodeRequest.method,
            headers: normalizedHeaders,
            signal: controller.signal,
        });
    }
    /**
     * Some Node server frameworks like Serverless Express sends a dummy object with body but as a Buffer not string
     * so we do those checks to see is there something we can use directly as BodyInit
     * because the presence of body means the request stream is already consumed and,
     * rawRequest cannot be used as BodyInit/ReadableStream by Fetch API in this case.
     */
    const maybeParsedBody = nodeRequest.body;
    if (maybeParsedBody != null && Object.keys(maybeParsedBody).length > 0) {
        if (isRequestBody(maybeParsedBody)) {
            return new fetchAPI.Request(fullUrl, {
                method: nodeRequest.method || 'GET',
                headers: normalizedHeaders,
                body: maybeParsedBody,
                signal: controller.signal,
            });
        }
        const request = new fetchAPI.Request(fullUrl, {
            method: nodeRequest.method || 'GET',
            headers: normalizedHeaders,
            signal: controller.signal,
        });
        if (!request.headers.get('content-type')?.includes('json')) {
            request.headers.set('content-type', 'application/json; charset=utf-8');
        }
        return new Proxy(request, {
            get(_target, prop, receiver) {
                switch (prop) {
                    case 'json':
                        return () => fakePromise(maybeParsedBody);
                    case 'text':
                        return () => fakePromise(JSON.stringify(maybeParsedBody));
                    default: {
                        const val = Reflect.get(request, prop, request);
                        if (typeof val === 'function') {
                            return function requestMethodWrapper(...args) {
                                return val.apply(this === receiver ? request : this, args);
                            };
                        }
                        return val;
                    }
                }
            },
        });
    }
    // perf: instead of spreading the object, we can just pass it as is and it performs better
    return new fetchAPI.Request(fullUrl, {
        method: nodeRequest.method,
        headers: normalizedHeaders,
        signal: controller.signal,
        // @ts-expect-error - AsyncIterable is supported as body
        body: rawRequest,
        duplex: 'half',
    });
}
export function isReadable(stream) {
    return stream.read != null;
}
export function isNodeRequest(request) {
    return isReadable(request);
}
export function isServerResponse(stream) {
    // Check all used functions are defined
    return (stream != null &&
        stream.setHeader != null &&
        stream.end != null &&
        stream.once != null &&
        stream.write != null);
}
export function isReadableStream(stream) {
    return stream != null && stream.getReader != null;
}
export function isFetchEvent(event) {
    return event != null && event.request != null && event.respondWith != null;
}
function configureSocket(rawRequest) {
    rawRequest?.socket?.setTimeout?.(0);
    rawRequest?.socket?.setNoDelay?.(true);
    rawRequest?.socket?.setKeepAlive?.(true);
}
function endResponse(serverResponse) {
    // @ts-expect-error Avoid arguments adaptor trampoline https://v8.dev/blog/adaptor-frame
    serverResponse.end(null, null, null);
}
function sendAsyncIterable(serverResponse, asyncIterable) {
    let closed = false;
    const closeEventListener = () => {
        closed = true;
    };
    serverResponse.once('error', closeEventListener);
    serverResponse.once('close', closeEventListener);
    serverResponse.once('finish', () => {
        serverResponse.removeListener('close', closeEventListener);
        serverResponse.removeListener('error', closeEventListener);
    });
    const iterator = asyncIterable[Symbol.asyncIterator]();
    return pumpToWritable(() => iterator.next(), serverResponse, () => closed);
}
function endDest(dest) {
    // @ts-expect-error Avoid arguments adaptor trampoline https://v8.dev/blog/adaptor-frame
    dest.end(null, null, null);
}
function pumpToWritable(source, dest, isClosed) {
    const pump = () => handleMaybePromise(source, sourceResult => {
        if (isClosed?.() || sourceResult.done) {
            return endDest(dest);
        }
        return handleMaybePromise(() => safeWrite(sourceResult.value, dest), () => (isClosed?.() ? endDest(dest) : pump()));
    });
    return pump();
}
function safeWrite(chunk, destination) {
    const result = destination.write(chunk);
    if (!result) {
        return new Promise(resolve => destination.once('drain', resolve));
    }
}
const isNode1x = globalThis.process?.versions?.node?.startsWith('1');
export function sendNodeResponse(fetchResponse, serverResponse, nodeRequest, __useSingleWriteHead) {
    if (serverResponse.closed || serverResponse.destroyed || serverResponse.writableEnded) {
        return;
    }
    if (!fetchResponse) {
        serverResponse.statusCode = 404;
        endResponse(serverResponse);
        return;
    }
    if (__useSingleWriteHead &&
        // @ts-expect-error - headersInit is a private property
        fetchResponse.headers?.headersInit &&
        // @ts-expect-error - headersInit is a private property
        !Array.isArray(fetchResponse.headers.headersInit) &&
        // @ts-expect-error - headersInit is a private property
        !fetchResponse.headers.headersInit.get &&
        // @ts-expect-error - map is a private property
        !fetchResponse.headers._map &&
        // @ts-expect-error - _setCookies is a private property
        !fetchResponse.headers._setCookies?.length) {
        // @ts-expect-error - writeHead accepts headers object
        serverResponse.writeHead(fetchResponse.status, fetchResponse.statusText, 
        // @ts-expect-error - headersInit is a private property
        fetchResponse.headers.headersInit);
    }
    else {
        // Avoid using `setHeaders` on Node.js 18 as it is broken with multiple headers with the same name
        // @ts-expect-error - setHeaders exist
        if (serverResponse.setHeaders && !isNode1x) {
            // @ts-expect-error - writeHead bad typings
            serverResponse.setHeaders(fetchResponse.headers);
        }
        else {
            let setCookiesSet = false;
            fetchResponse.headers.forEach((value, key) => {
                if (key === 'set-cookie') {
                    if (setCookiesSet) {
                        return;
                    }
                    setCookiesSet = true;
                    const setCookies = fetchResponse.headers.getSetCookie?.();
                    if (setCookies) {
                        serverResponse.setHeader('set-cookie', setCookies);
                        return;
                    }
                }
                serverResponse.setHeader(key, value);
            });
        }
        // @ts-expect-error - writeHead bad typings
        serverResponse.writeHead(fetchResponse.status, fetchResponse.statusText);
    }
    // @ts-expect-error - Handle the case where the response is a string
    if (fetchResponse['bodyType'] === 'String') {
        const bodyString = 
        // @ts-expect-error - bodyInit is a private property
        fetchResponse['bodyInit'];
        return handleMaybePromise(() => safeWrite(bodyString, serverResponse), () => endResponse(serverResponse));
    }
    // Optimizations for node-fetch
    const bufOfRes = 
    // @ts-expect-error - _buffer is a private property
    fetchResponse._buffer;
    if (bufOfRes) {
        return handleMaybePromise(() => safeWrite(bufOfRes, serverResponse), () => endResponse(serverResponse));
    }
    // Other fetch implementations
    const fetchBody = fetchResponse.body;
    if (fetchBody == null) {
        endResponse(serverResponse);
        return;
    }
    if (
    // @ts-expect-error - Uint8Array is a valid body type
    fetchBody[Symbol.toStringTag] === 'Uint8Array') {
        return handleMaybePromise(() => safeWrite(fetchBody, serverResponse), () => endResponse(serverResponse));
    }
    configureSocket(nodeRequest);
    if (isReadable(fetchBody)) {
        serverResponse.once('close', () => {
            fetchBody.destroy();
        });
        fetchBody.pipe(serverResponse, {
            end: true,
        });
        return;
    }
    if (isReadableStream(fetchBody)) {
        return sendReadableStream(nodeRequest, serverResponse, fetchBody);
    }
    if (isAsyncIterable(fetchBody)) {
        return sendAsyncIterable(serverResponse, fetchBody);
    }
}
function sendReadableStream(nodeRequest, serverResponse, readableStream) {
    const reader = readableStream.getReader();
    nodeRequest?.once?.('error', err => {
        reader.cancel(err);
    });
    return pumpToWritable(() => reader.read(), serverResponse);
}
export function isRequestInit(val) {
    return (val != null &&
        typeof val === 'object' &&
        ('body' in val ||
            'cache' in val ||
            'credentials' in val ||
            'headers' in val ||
            'integrity' in val ||
            'keepalive' in val ||
            'method' in val ||
            'mode' in val ||
            'redirect' in val ||
            'referrer' in val ||
            'referrerPolicy' in val ||
            'signal' in val ||
            'window' in val));
}
// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#copying_accessors
export function completeAssign(...args) {
    const [target, ...sources] = args.filter(arg => arg != null && typeof arg === 'object');
    sources.forEach(source => {
        // modified Object.keys to Object.getOwnPropertyNames
        // because Object.keys only returns enumerable properties
        const descriptors = Object.getOwnPropertyNames(source).reduce((descriptors, key) => {
            const descriptor = Object.getOwnPropertyDescriptor(source, key);
            if (descriptor) {
                descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
            }
            return descriptors;
        }, {});
        // By default, Object.assign copies enumerable Symbols, too
        Object.getOwnPropertySymbols(source).forEach(sym => {
            const descriptor = Object.getOwnPropertyDescriptor(source, sym);
            if (descriptor?.enumerable) {
                descriptors[sym] = descriptor;
            }
        });
        Object.defineProperties(target, descriptors);
    });
    return target;
}
export { iterateAsyncVoid } from '@whatwg-node/promise-helpers';
export function handleErrorFromRequestHandler(error, ResponseCtor) {
    return new ResponseCtor(error.stack || error.message || error.toString(), {
        status: error.status || 500,
    });
}
export function isolateObject(originalCtx, waitUntilFn) {
    if (originalCtx == null) {
        if (waitUntilFn == null) {
            return {};
        }
        return {
            waitUntil: waitUntilFn,
        };
    }
    return completeAssign(Object.create(originalCtx), {
        waitUntil: waitUntilFn,
    }, originalCtx);
}
export function handleAbortSignalAndPromiseResponse(response$, abortSignal) {
    if (abortSignal?.aborted) {
        throw abortSignal.reason;
    }
    if (isPromise(response$) && abortSignal) {
        const deferred$ = createDeferredPromise();
        function abortSignalFetchErrorHandler() {
            deferred$.reject(abortSignal.reason);
        }
        abortSignal.addEventListener('abort', abortSignalFetchErrorHandler, { once: true });
        response$
            .then(function fetchSuccessHandler(res) {
            deferred$.resolve(res);
        })
            .catch(function fetchErrorHandler(err) {
            deferred$.reject(err);
        })
            .finally(() => {
            abortSignal.removeEventListener('abort', abortSignalFetchErrorHandler);
        });
        return deferred$.promise;
    }
    return response$;
}
export const decompressedResponseMap = new WeakMap();
const supportedEncodingsByFetchAPI = new WeakMap();
export function getSupportedEncodings(fetchAPI) {
    let supportedEncodings = supportedEncodingsByFetchAPI.get(fetchAPI);
    if (!supportedEncodings) {
        const possibleEncodings = [
            'deflate',
            'gzip',
            'deflate-raw',
            'br',
            'zstd',
        ];
        if (fetchAPI.DecompressionStream?.['supportedFormats']) {
            supportedEncodings = fetchAPI.DecompressionStream['supportedFormats'];
        }
        else {
            supportedEncodings = possibleEncodings.filter(encoding => {
                // deflate-raw is not supported in Node.js >v20
                if (globalThis.process?.version?.startsWith('v2') &&
                    fetchAPI.DecompressionStream === globalThis.DecompressionStream &&
                    encoding === 'deflate-raw') {
                    return false;
                }
                try {
                    // eslint-disable-next-line no-new
                    new fetchAPI.DecompressionStream(encoding);
                    return true;
                }
                catch {
                    return false;
                }
            });
        }
        supportedEncodingsByFetchAPI.set(fetchAPI, supportedEncodings);
    }
    return supportedEncodings;
}
export function handleResponseDecompression(response, fetchAPI) {
    const contentEncodingHeader = response?.headers.get('content-encoding');
    if (!contentEncodingHeader || contentEncodingHeader === 'none') {
        return response;
    }
    if (!response?.body) {
        return response;
    }
    let decompressedResponse = decompressedResponseMap.get(response);
    if (!decompressedResponse || decompressedResponse.bodyUsed) {
        let decompressedBody = response.body;
        const contentEncodings = contentEncodingHeader.split(',');
        if (!contentEncodings.every(encoding => getSupportedEncodings(fetchAPI).includes(encoding))) {
            return new fetchAPI.Response(`Unsupported 'Content-Encoding': ${contentEncodingHeader}`, {
                status: 415,
                statusText: 'Unsupported Media Type',
            });
        }
        for (const contentEncoding of contentEncodings) {
            decompressedBody = decompressedBody.pipeThrough(new fetchAPI.DecompressionStream(contentEncoding));
        }
        decompressedResponse = new fetchAPI.Response(decompressedBody, response);
        decompressedResponseMap.set(response, decompressedResponse);
    }
    return decompressedResponse;
}
const terminateEvents = ['SIGINT', 'exit', 'SIGTERM'];
const disposableStacks = new Set();
let eventListenerRegistered = false;
function ensureEventListenerForDisposableStacks() {
    if (eventListenerRegistered) {
        return;
    }
    eventListenerRegistered = true;
    for (const event of terminateEvents) {
        globalThis.process.once(event, function terminateHandler() {
            return Promise.allSettled([...disposableStacks].map(stack => !stack.disposed && stack.disposeAsync()));
        });
    }
}
export function ensureDisposableStackRegisteredForTerminateEvents(disposableStack) {
    if (globalThis.process) {
        ensureEventListenerForDisposableStacks();
        if (!disposableStacks.has(disposableStack)) {
            disposableStacks.add(disposableStack);
            disposableStack.defer(() => {
                disposableStacks.delete(disposableStack);
            });
        }
    }
}
class CustomAbortControllerSignal extends EventTarget {
    aborted = false;
    _onabort = null;
    _reason;
    constructor() {
        super();
        const nodeEvents = globalThis.process?.getBuiltinModule?.('node:events');
        // @ts-expect-error - We know kMaxEventTargetListeners is available in node:events
        if (nodeEvents?.kMaxEventTargetListeners) {
            // @ts-expect-error - See https://github.com/nodejs/node/pull/55816/files#diff-03bd4f07a1006cb0daaddced702858751b20f5ab7681cb0719c1b1d80d6ca05cR31
            this[nodeEvents.kMaxEventTargetListeners] = 0;
        }
    }
    throwIfAborted() {
        if (this._nativeCtrl?.signal?.throwIfAborted) {
            return this._nativeCtrl.signal.throwIfAborted();
        }
        if (this.aborted) {
            throw this._reason;
        }
    }
    _nativeCtrl;
    ensureNativeCtrl() {
        if (!this._nativeCtrl) {
            const isAborted = this.aborted;
            this._nativeCtrl = new AbortController();
            if (isAborted) {
                this._nativeCtrl.abort(this._reason);
            }
        }
        return this._nativeCtrl;
    }
    abort(reason) {
        if (this._nativeCtrl?.abort) {
            return this._nativeCtrl?.abort(reason);
        }
        this._reason = reason || new DOMException('This operation was aborted', 'AbortError');
        this.aborted = true;
        this.dispatchEvent(new Event('abort'));
    }
    get signal() {
        if (this._nativeCtrl?.signal) {
            return this._nativeCtrl.signal;
        }
        return this;
    }
    get reason() {
        if (this._nativeCtrl?.signal) {
            return this._nativeCtrl.signal.reason;
        }
        return this._reason;
    }
    get onabort() {
        if (this._onabort) {
            return this._onabort;
        }
        return this._onabort;
    }
    set onabort(value) {
        if (this._nativeCtrl?.signal) {
            this._nativeCtrl.signal.onabort = value;
            return;
        }
        if (this._onabort) {
            this.removeEventListener('abort', this._onabort);
        }
        this._onabort = value;
        if (value) {
            this.addEventListener('abort', value);
        }
    }
}
export function createCustomAbortControllerSignal() {
    if (globalThis.Bun || globalThis.Deno) {
        return new AbortController();
    }
    return new Proxy(new CustomAbortControllerSignal(), {
        get(target, prop, receiver) {
            if (prop.toString().includes('kDependantSignals')) {
                const nativeCtrl = target.ensureNativeCtrl();
                return Reflect.get(nativeCtrl.signal, prop, nativeCtrl.signal);
            }
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
            if (prop.toString().includes('kDependantSignals')) {
                const nativeCtrl = target.ensureNativeCtrl();
                return Reflect.set(nativeCtrl.signal, prop, value, nativeCtrl.signal);
            }
            return Reflect.set(target, prop, value, receiver);
        },
        getPrototypeOf() {
            return AbortSignal.prototype;
        },
    });
}
