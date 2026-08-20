var graphql_web = require('@0no-co/graphql.web');
var wonka = require('wonka');

var generateErrorMessage = (networkErr, graphQlErrs) => {
  var error = '';
  if (networkErr) return `[Network] ${networkErr.message}`;
  if (graphQlErrs) {
    for (var i = 0, l = graphQlErrs.length; i < l; i++) {
      if (error) error += '\n';
      error += `[GraphQL] ${graphQlErrs[i].message}`;
    }
  }
  return error;
};
var rehydrateGraphQlError = error => {
  if (error && typeof error.message === 'string' && (error.extensions || error.name === 'GraphQLError')) {
    return error;
  } else if (typeof error === 'object' && typeof error.message === 'string') {
    return new graphql_web.GraphQLError(error.message, error.nodes, error.source, error.positions, error.path, error, error.extensions || {});
  } else {
    return new graphql_web.GraphQLError(error);
  }
};

/** An abstracted `Error` that provides either a `networkError` or `graphQLErrors`.
 *
 * @remarks
 * During a GraphQL request, either the request can fail entirely, causing a network error,
 * or the GraphQL execution or fields can fail, which will cause an {@link ExecutionResult}
 * to contain an array of GraphQL errors.
 *
 * The `CombinedError` abstracts and normalizes both failure cases. When {@link OperationResult.error}
 * is set to this error, the `CombinedError` abstracts all errors, making it easier to handle only
 * a subset of error cases.
 *
 * @see {@link https://urql.dev/goto/docs/basics/errors} for more information on handling
 * GraphQL errors and the `CombinedError`.
 */
class CombinedError extends Error {
  /** A list of GraphQL errors rehydrated from a {@link ExecutionResult}.
   *
   * @remarks
   * If an {@link ExecutionResult} received from the API contains a list of errors,
   * the `CombinedError` will rehydrate them, normalize them to
   * {@link GraphQLError | GraphQLErrors} and list them here.
   * An empty list indicates that no GraphQL error has been sent by the API.
   */

  /** Set to an error, if a GraphQL request has failed outright.
   *
   * @remarks
   * A GraphQL over HTTP request may fail and not reach the API. Any error that
   * prevents a GraphQl request outright, will be considered a “network error” and
   * set here.
   */

  /** Set to the {@link Response} object a fetch exchange received.
   *
   * @remarks
   * If a built-in fetch {@link Exchange} is used in `urql`, this may
   * be set to the {@link Response} object of the Fetch API response.
   * However, since `urql` doesn’t assume that all users will use HTTP
   * as the only or exclusive transport for GraphQL this property is
   * neither typed nor guaranteed and may be re-used for other purposes
   * by non-fetch exchanges.
   *
   * Hint: It can be useful to use `response.status` here, however, if
   * you plan on relying on this being a {@link Response} in your app,
   * which it is by default, then make sure you add some extra checks
   * before blindly assuming so!
   */

  constructor(input) {
    var normalizedGraphQLErrors = (input.graphQLErrors || []).map(rehydrateGraphQlError);
    var message = generateErrorMessage(input.networkError, normalizedGraphQLErrors);
    super(message);
    this.name = 'CombinedError';
    this.message = message;
    this.graphQLErrors = normalizedGraphQLErrors;
    this.networkError = input.networkError;
    this.response = input.response;
  }
  toString() {
    return this.message;
  }
}

/** A hash value as computed by {@link phash}.
 *
 * @remarks
 * Typically `HashValue`s are used as hashes and keys of GraphQL documents,
 * variables, and combined, for GraphQL requests.
 */

/** Computes a djb2 hash of the given string.
 *
 * @param x - the string to be hashed
 * @param seed - optionally a prior hash for progressive hashing
 * @returns a hash value, i.e. a number
 *
 * @remark
 * This is the hashing function used throughout `urql`, primarily to compute
 * {@link Operation.key}.
 *
 * @see {@link http://www.cse.yorku.ca/~oz/hash.html#djb2} for a further description of djb2.
 */
var phash = (x, seed) => {
  var h = (seed || 5381) | 0;
  for (var i = 0, l = x.length | 0; i < l; i++) h = (h << 5) + h + x.charCodeAt(i);
  return h;
};

var seen = new Set();
var cache = new WeakMap();
var stringify = (x, includeFiles) => {
  if (x === null || seen.has(x)) {
    return 'null';
  } else if (typeof x !== 'object') {
    return JSON.stringify(x) || '';
  } else if (x.toJSON) {
    return stringify(x.toJSON(), includeFiles);
  } else if (Array.isArray(x)) {
    var _out = '[';
    for (var i = 0, l = x.length; i < l; i++) {
      if (_out.length > 1) _out += ',';
      _out += stringify(x[i], includeFiles) || 'null';
    }
    _out += ']';
    return _out;
  } else if (!includeFiles && (FileConstructor !== NoopConstructor && x instanceof FileConstructor || BlobConstructor !== NoopConstructor && x instanceof BlobConstructor)) {
    return 'null';
  }
  var keys = Object.keys(x).sort();
  if (!keys.length && x.constructor && Object.getPrototypeOf(x).constructor !== Object.prototype.constructor) {
    var key = cache.get(x) || Math.random().toString(36).slice(2);
    cache.set(x, key);
    return stringify({
      __key: key
    }, includeFiles);
  }
  seen.add(x);
  var out = '{';
  for (var _i = 0, _l = keys.length; _i < _l; _i++) {
    var value = stringify(x[keys[_i]], includeFiles);
    if (value) {
      if (out.length > 1) out += ',';
      out += stringify(keys[_i], includeFiles) + ':' + value;
    }
  }
  seen.delete(x);
  out += '}';
  return out;
};
var extract = (map, path, x) => {
  if (x == null || typeof x !== 'object' || x.toJSON || seen.has(x)) ; else if (Array.isArray(x)) {
    for (var i = 0, l = x.length; i < l; i++) extract(map, `${path}.${i}`, x[i]);
  } else if (x instanceof FileConstructor || x instanceof BlobConstructor) {
    map.set(path, x);
  } else {
    seen.add(x);
    for (var key in x) extract(map, `${path}.${key}`, x[key]);
  }
};

/** A stable stringifier for GraphQL variables objects.
 *
 * @param x - any JSON-like data.
 * @return A JSON string.
 *
 * @remarks
 * This utility creates a stable JSON string from any passed data,
 * and protects itself from throwing.
 *
 * The JSON string is stable insofar as objects’ keys are sorted,
 * and instances of non-plain objects are replaced with random keys
 * replacing their values, which remain stable for the objects’
 * instance.
 */
var stringifyVariables = (x, includeFiles) => {
  seen.clear();
  return stringify(x, includeFiles || false);
};
class NoopConstructor {}
var FileConstructor = typeof File !== 'undefined' ? File : NoopConstructor;
var BlobConstructor = typeof Blob !== 'undefined' ? Blob : NoopConstructor;
var extractFiles = x => {
  var map = new Map();
  if (FileConstructor !== NoopConstructor || BlobConstructor !== NoopConstructor) {
    seen.clear();
    extract(map, 'variables', x);
  }
  return map;
};

/** A `DocumentNode` annotated with its hashed key.
 * @internal
 */

var SOURCE_NAME = 'gql';
var GRAPHQL_STRING_RE = /("{3}[\s\S]*"{3}|"(?:\\.|[^"])*")/g;
var REPLACE_CHAR_RE = /(?:#[^\n\r]+)?(?:[\r\n]+|$)/g;
var replaceOutsideStrings = (str, idx) => idx % 2 === 0 ? str.replace(REPLACE_CHAR_RE, '\n') : str;

/** Sanitizes a GraphQL document string by replacing comments and redundant newlines in it. */
var sanitizeDocument = node => node.split(GRAPHQL_STRING_RE).map(replaceOutsideStrings).join('').trim();
var prints = new Map();
var docs = new Map();

/** A cached printing function for GraphQL documents.
 *
 * @param node - A string of a document or a {@link DocumentNode}
 * @returns A normalized printed string of the passed GraphQL document.
 *
 * @remarks
 * This function accepts a GraphQL query string or {@link DocumentNode},
 * then prints and sanitizes it. The sanitizer takes care of removing
 * comments, which otherwise alter the key of the document although the
 * document is otherwise equivalent to another.
 *
 * When a {@link DocumentNode} is passed to this function, it caches its
 * output by modifying the `loc.source.body` property on the GraphQL node.
 */
var stringifyDocument = node => {
  var printed;
  if (typeof node === 'string') {
    printed = sanitizeDocument(node);
  } else if (node.loc && docs.get(node.__key) === node) {
    printed = node.loc.source.body;
  } else {
    printed = prints.get(node) || sanitizeDocument(graphql_web.print(node));
    prints.set(node, printed);
  }
  if (typeof node !== 'string' && !node.loc) {
    node.loc = {
      start: 0,
      end: printed.length,
      source: {
        body: printed,
        name: SOURCE_NAME,
        locationOffset: {
          line: 1,
          column: 1
        }
      }
    };
  }
  return printed;
};

/** Computes the hash for a document's string using {@link stringifyDocument}'s output.
 *
 * @param node - A string of a document or a {@link DocumentNode}
 * @returns A {@link HashValue}
 *
 * @privateRemarks
 * This function adds the operation name of the document to the hash, since sometimes
 * a merged document with multiple operations may be used. Although `urql` requires a
 * `DocumentNode` to only contain a single operation, when the cached `loc.source.body`
 * of a `DocumentNode` is used, this string may still contain multiple operations and
 * the resulting hash should account for only one at a time.
 */
var hashDocument = node => {
  var key;
  if (node.documentId) {
    key = phash(node.documentId);
  } else {
    key = phash(stringifyDocument(node));
    // Add the operation name to the produced hash
    if (node.definitions) {
      var operationName = getOperationName(node);
      if (operationName) key = phash(`\n# ${operationName}`, key);
    }
  }
  return key;
};

/** Returns a canonical version of the passed `DocumentNode` with an added hash key.
 *
 * @param node - A string of a document or a {@link DocumentNode}
 * @returns A {@link KeyedDocumentNode}
 *
 * @remarks
 * `urql` will always avoid unnecessary work, no matter whether a user passes `DocumentNode`s
 * or strings of GraphQL documents to its APIs.
 *
 * This function will return a canonical version of a {@link KeyedDocumentNode} no matter
 * which kind of input is passed, avoiding parsing or hashing of passed data as needed.
 */
var keyDocument = node => {
  var key;
  var query;
  if (typeof node === 'string') {
    key = hashDocument(node);
    query = docs.get(key) || graphql_web.parse(node, {
      noLocation: true
    });
  } else {
    key = node.__key || hashDocument(node);
    query = docs.get(key) || node;
  }

  // Add location information if it's missing
  if (!query.loc) stringifyDocument(query);
  query.__key = key;
  docs.set(key, query);
  return query;
};

/** Creates a `GraphQLRequest` from the passed parameters.
 *
 * @param q - A string of a document or a {@link DocumentNode}
 * @param variables - A variables object for the defined GraphQL operation.
 * @returns A {@link GraphQLRequest}
 *
 * @remarks
 * `createRequest` creates a {@link GraphQLRequest} from the passed parameters,
 * while replacing the document as needed with a canonical version of itself,
 * to avoid parsing, printing, or hashing the same input multiple times.
 *
 * If no variables are passed, canonically it'll default to an empty object,
 * which is removed from the resulting hash key.
 */
var createRequest = (_query, _variables, extensions) => {
  var variables = _variables || {};
  var query = keyDocument(_query);
  var printedVars = stringifyVariables(variables, true);
  var key = query.__key;
  if (printedVars !== '{}') key = phash(printedVars, key);
  return {
    key,
    query,
    variables,
    extensions
  };
};

/** Returns the name of the `DocumentNode`'s operation, if any.
 * @param query - A {@link DocumentNode}
 * @returns the operation's name contained within the document, or `undefined`
 */
var getOperationName = query => {
  for (var i = 0, l = query.definitions.length; i < l; i++) {
    var node = query.definitions[i];
    if (node.kind === graphql_web.Kind.OPERATION_DEFINITION) {
      return node.name ? node.name.value : undefined;
    }
  }
};

/** Returns the type of the `DocumentNode`'s operation, if any.
 * @param query - A {@link DocumentNode}
 * @returns the operation's type contained within the document, or `undefined`
 */
var getOperationType = query => {
  for (var i = 0, l = query.definitions.length; i < l; i++) {
    var node = query.definitions[i];
    if (node.kind === graphql_web.Kind.OPERATION_DEFINITION) {
      return node.operation;
    }
  }
};

/** Converts the `ExecutionResult` received for a given `Operation` to an `OperationResult`.
 *
 * @param operation - The {@link Operation} for which the API’s result is for.
 * @param result - The GraphQL API’s {@link ExecutionResult}.
 * @param response - Optionally, a raw object representing the API’s result (Typically a {@link Response}).
 * @returns An {@link OperationResult}.
 *
 * @remarks
 * This utility can be used to create {@link OperationResult | OperationResults} in the shape
 * that `urql` expects and defines, and should be used rather than creating the results manually.
 *
 * @throws
 * If no data, or errors are contained within the result, or the result is instead an incremental
 * response containing a `path` property, a “No Content” error is thrown.
 *
 * @see {@link ExecutionResult} for the type definition of GraphQL API results.
 */
var makeResult = (operation, result, response) => {
  if (!('data' in result) && (!('errors' in result) || !Array.isArray(result.errors))) {
    throw new Error('No Content');
  }
  var defaultHasNext = operation.kind === 'subscription';
  return {
    operation,
    data: result.data,
    error: Array.isArray(result.errors) ? new CombinedError({
      graphQLErrors: result.errors,
      response
    }) : undefined,
    extensions: result.extensions ? {
      ...result.extensions
    } : undefined,
    hasNext: result.hasNext == null ? defaultHasNext : result.hasNext,
    stale: false
  };
};
var deepMerge = (target, source) => {
  if (typeof target === 'object' && target != null) {
    if (Array.isArray(target)) {
      target = [...target];
      for (var i = 0, l = source.length; i < l; i++) target[i] = deepMerge(target[i], source[i]);
      return target;
    }
    if (!target.constructor || target.constructor === Object) {
      target = {
        ...target
      };
      for (var key in source) target[key] = deepMerge(target[key], source[key]);
      return target;
    }
  }
  return source;
};

/** Merges an incrementally delivered `ExecutionResult` into a previous `OperationResult`.
 *
 * @param prevResult - The {@link OperationResult} that preceded this result.
 * @param path - The GraphQL API’s {@link ExecutionResult} that should be patching the `prevResult`.
 * @param response - Optionally, a raw object representing the API’s result (Typically a {@link Response}).
 * @returns A new {@link OperationResult} patched with the incremental result.
 *
 * @remarks
 * This utility should be used to merge subsequent {@link ExecutionResult | ExecutionResults} of
 * incremental responses into a prior {@link OperationResult}.
 *
 * When directives like `@defer`, `@stream`, and `@live` are used, GraphQL may deliver new
 * results that modify previous results. In these cases, it'll set a `path` property to modify
 * the result it sent last. This utility is built to handle these cases and merge these payloads
 * into existing {@link OperationResult | OperationResults}.
 *
 * @see {@link ExecutionResult} for the type definition of GraphQL API results.
 */
var mergeResultPatch = (prevResult, nextResult, response, pending) => {
  var errors = prevResult.error ? prevResult.error.graphQLErrors : [];
  var hasExtensions = !!prevResult.extensions || !!(nextResult.payload || nextResult).extensions;
  var extensions = {
    ...prevResult.extensions,
    ...(nextResult.payload || nextResult).extensions
  };
  var incremental = nextResult.incremental;

  // NOTE: We handle the old version of the incremental delivery payloads as well
  if ('path' in nextResult) {
    incremental = [nextResult];
  }
  var withData = {
    data: prevResult.data
  };
  if (incremental) {
    var _loop = function () {
      var patch = incremental[i];
      if (Array.isArray(patch.errors)) {
        errors.push(...patch.errors);
      }
      if (patch.extensions) {
        Object.assign(extensions, patch.extensions);
        hasExtensions = true;
      }
      var prop = 'data';
      var part = withData;
      var path = [];
      if (patch.path) {
        path = patch.path;
      } else if (pending) {
        var res = pending.find(pendingRes => pendingRes.id === patch.id);
        if (patch.subPath) {
          path = [...res.path, ...patch.subPath];
        } else {
          path = res.path;
        }
      }
      for (var _i = 0, _l = path.length; _i < _l; prop = path[_i++]) {
        part = part[prop] = Array.isArray(part[prop]) ? [...part[prop]] : {
          ...part[prop]
        };
      }
      if (patch.items) {
        var startIndex = +prop >= 0 ? prop : 0;
        for (var _i2 = 0, _l2 = patch.items.length; _i2 < _l2; _i2++) part[startIndex + _i2] = deepMerge(part[startIndex + _i2], patch.items[_i2]);
      } else if (patch.data !== undefined) {
        part[prop] = deepMerge(part[prop], patch.data);
      }
    };
    for (var i = 0, l = incremental.length; i < l; i++) {
      _loop();
    }
  } else {
    withData.data = (nextResult.payload || nextResult).data || prevResult.data;
    errors = nextResult.errors || nextResult.payload && nextResult.payload.errors || errors;
  }
  return {
    operation: prevResult.operation,
    data: withData.data,
    error: errors.length ? new CombinedError({
      graphQLErrors: errors,
      response
    }) : undefined,
    extensions: hasExtensions ? extensions : undefined,
    hasNext: nextResult.hasNext != null ? nextResult.hasNext : prevResult.hasNext,
    stale: false
  };
};

/** Creates an `OperationResult` containing a network error for requests that encountered unexpected errors.
 *
 * @param operation - The {@link Operation} for which the API’s result is for.
 * @param error - The network-like error that prevented an API result from being delivered.
 * @param response - Optionally, a raw object representing the API’s result (Typically a {@link Response}).
 * @returns An {@link OperationResult} containing only a {@link CombinedError}.
 *
 * @remarks
 * This utility can be used to create {@link OperationResult | OperationResults} in the shape
 * that `urql` expects and defines, and should be used rather than creating the results manually.
 * This function should be used for when the {@link CombinedError.networkError} property is
 * populated and no GraphQL execution actually occurred.
 */
var makeErrorResult = (operation, error, response) => ({
  operation,
  data: undefined,
  error: new CombinedError({
    networkError: error,
    response
  }),
  extensions: undefined,
  hasNext: false,
  stale: false
});

/** Abstract definition of the JSON data sent during GraphQL HTTP POST requests. */

/** Creates a GraphQL over HTTP compliant JSON request body.
 * @param request - An object containing a `query` document and `variables`.
 * @returns A {@link FetchBody}
 * @see {@link https://github.com/graphql/graphql-over-http} for the GraphQL over HTTP spec.
 */
function makeFetchBody(request) {
  var body = {
    query: undefined,
    documentId: undefined,
    operationName: getOperationName(request.query),
    variables: request.variables || undefined,
    extensions: request.extensions
  };
  if ('documentId' in request.query && request.query.documentId && (
  // NOTE: We have to check that the document will definitely be sent
  // as a persisted document to avoid breaking changes
  !request.query.definitions || !request.query.definitions.length)) {
    body.documentId = request.query.documentId;
  } else if (!request.extensions || !request.extensions.persistedQuery || !!request.extensions.persistedQuery.miss) {
    body.query = stringifyDocument(request.query);
  }
  return body;
}

/** Creates a URL that will be called for a GraphQL HTTP request.
 *
 * @param operation - An {@link Operation} for which to make the request.
 * @param body - A {@link FetchBody} which may be replaced with a URL.
 *
 * @remarks
 * Creates the URL that’ll be called as part of a GraphQL HTTP request.
 * Built-in fetch exchanges support sending GET requests, even for
 * non-persisted full requests, which this function supports by being
 * able to serialize GraphQL requests into the URL.
 */
var makeFetchURL = (operation, body) => {
  var useGETMethod = operation.kind === 'query' && operation.context.preferGetMethod;
  if (!useGETMethod || !body) return operation.context.url;
  var urlParts = splitOutSearchParams(operation.context.url);
  for (var key in body) {
    var value = body[key];
    if (value) {
      urlParts[1].set(key, typeof value === 'object' ? stringifyVariables(value) : value);
    }
  }
  var finalUrl = urlParts.join('?');
  if (finalUrl.length > 2047 && useGETMethod !== 'force') {
    operation.context.preferGetMethod = false;
    return operation.context.url;
  }
  return finalUrl;
};
var splitOutSearchParams = url => {
  var start = url.indexOf('?');
  return start > -1 ? [url.slice(0, start), new URLSearchParams(url.slice(start + 1))] : [url, new URLSearchParams()];
};

/** Serializes a {@link FetchBody} into a {@link RequestInit.body} format. */
var serializeBody = (operation, body) => {
  var omitBody = operation.kind === 'query' && !!operation.context.preferGetMethod;
  if (body && !omitBody) {
    var json = stringifyVariables(body);
    var files = extractFiles(body.variables);
    if (files.size) {
      var form = new FormData();
      form.append('operations', json);
      form.append('map', stringifyVariables({
        ...[...files.keys()].map(value => [value])
      }));
      var index = 0;
      for (var file of files.values()) form.append(`${index++}`, file);
      return form;
    }
    return json;
  }
};
var isHeaders = headers => 'has' in headers && !Object.keys(headers).length;

/** Creates a `RequestInit` object for a given `Operation`.
 *
 * @param operation - An {@link Operation} for which to make the request.
 * @param body - A {@link FetchBody} which is added to the options, if the request isn’t a GET request.
 *
 * @remarks
 * Creates the fetch options {@link RequestInit} object that’ll be passed to the Fetch API
 * as part of a GraphQL over HTTP request. It automatically sets a default `Content-Type`
 * header.
 *
 * @see {@link https://github.com/graphql/graphql-over-http} for the GraphQL over HTTP spec.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} for the Fetch API spec.
 */
var makeFetchOptions = (operation, body) => {
  var headers = {
    accept: operation.kind === 'subscription' ? 'text/event-stream, multipart/mixed' : 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed'
  };
  var extraOptions = (typeof operation.context.fetchOptions === 'function' ? operation.context.fetchOptions() : operation.context.fetchOptions) || {};
  if (extraOptions.headers) {
    if (isHeaders(extraOptions.headers)) {
      extraOptions.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(extraOptions.headers)) {
      extraOptions.headers.forEach((value, key) => {
        if (Array.isArray(value)) {
          if (headers[value[0]]) {
            headers[value[0]] = `${headers[value[0]]},${value[1]}`;
          } else {
            headers[value[0]] = value[1];
          }
        } else {
          headers[key] = value;
        }
      });
    } else {
      for (var key in extraOptions.headers) {
        headers[key.toLowerCase()] = extraOptions.headers[key];
      }
    }
  }
  var serializedBody = serializeBody(operation, body);
  if (typeof serializedBody === 'string' && !headers['content-type']) headers['content-type'] = 'application/json';
  return {
    ...extraOptions,
    method: serializedBody ? 'POST' : 'GET',
    body: serializedBody,
    headers
  };
};

/* Summary: This file handles the HTTP transport via GraphQL over HTTP
 * See: https://graphql.github.io/graphql-over-http/draft/
 *
 * `@urql/core`, by default, implements several RFC'd protocol extensions
 * on top of this. As such, this implementation supports:
 * - [Incremental Delivery](https://github.com/graphql/graphql-over-http/blob/main/rfcs/IncrementalDelivery.md)
 * - [GraphQL over SSE](https://github.com/graphql/graphql-over-http/blob/main/rfcs/GraphQLOverSSE.md)
 *
 * This also supports the "Defer Stream" payload format.
 * See: https://github.com/graphql/graphql-wg/blob/main/rfcs/DeferStream.md
 * Implementation for this is located in `../utils/result.ts` in `mergeResultPatch`
 *
 * And; this also supports the GraphQL Multipart spec for file uploads.
 * See: https://github.com/jaydenseric/graphql-multipart-request-spec
 * Implementation for this is located in `../utils/variables.ts` in `extractFiles`,
 * and `./fetchOptions.ts` in `serializeBody`.
 *
 * And; this also supports GET requests (and hence; automatic persisted queries)
 * via the `@urql/exchange-persisted` package.
 *
 * This implementation DOES NOT support Batching.
 * See: https://github.com/graphql/graphql-over-http/blob/main/rfcs/Batching.md
 * Which is deemed out-of-scope, as it's sufficiently unnecessary given
 * modern handling of HTTP requests being in parallel.
 *
 * The implementation in this file needs to make certain accommodations for:
 * - The Web Fetch API
 * - Non-browser or polyfill Fetch APIs
 * - Node.js-like Fetch implementations
 *
 * GraphQL over SSE has a reference implementation, which supports non-HTTP/2
 * modes and is a faithful implementation of the spec.
 * See: https://github.com/enisdenjo/graphql-sse
 *
 * GraphQL Inremental Delivery (aka “GraphQL Multipart Responses”) has a
 * reference implementation, which a prior implementation of this file heavily
 * leaned on (See prior attribution comments)
 * See: https://github.com/maraisr/meros
 *
 * This file merges support for all three GraphQL over HTTP response formats
 * via async generators and Wonka’s `fromAsyncIterable`. As part of this, `streamBody`
 * and `split` are the common, cross-compatible base implementations.
 */

var boundaryHeaderRe = /boundary="?([^=";]+)"?/i;
var eventStreamRe = /data: ?([^\n]+)/;
async function* streamBody(response) {
  if (response.body[Symbol.asyncIterator]) {
    for await (var chunk of response.body) yield chunk;
  } else {
    var reader = response.body.getReader();
    var result;
    try {
      while (!(result = await reader.read()).done) yield result.value;
    } finally {
      reader.cancel();
    }
  }
}
async function* streamToBoundedChunks(chunks, boundary) {
  var decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;
  var buffer = '';
  var boundaryIndex;
  for await (var chunk of chunks) {
    // NOTE: We're avoiding referencing the `Buffer` global here to prevent
    // auto-polyfilling in Webpack
    buffer += chunk.constructor.name === 'Buffer' ? chunk.toString() : decoder.decode(chunk, {
      stream: true
    });
    while ((boundaryIndex = buffer.indexOf(boundary)) > -1) {
      yield buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + boundary.length);
    }
  }
}
async function* parseJSON(response) {
  yield JSON.parse(await response.text());
}
async function* parseEventStream(response) {
  var payload;
  for await (var chunk of streamToBoundedChunks(streamBody(response), '\n\n')) {
    var match = chunk.match(eventStreamRe);
    if (match) {
      var _chunk = match[1];
      try {
        yield payload = JSON.parse(_chunk);
      } catch (error) {
        if (!payload) throw error;
      }
      if (payload && payload.hasNext === false) break;
    }
  }
  if (payload && payload.hasNext !== false) {
    yield {
      hasNext: false
    };
  }
}
async function* parseMultipartMixed(contentType, response) {
  var boundaryHeader = contentType.match(boundaryHeaderRe);
  var boundary = '--' + (boundaryHeader ? boundaryHeader[1] : '-');
  var isPreamble = true;
  var payload;
  for await (var chunk of streamToBoundedChunks(streamBody(response), '\r\n' + boundary)) {
    if (isPreamble) {
      isPreamble = false;
      var preambleIndex = chunk.indexOf(boundary);
      if (preambleIndex > -1) {
        chunk = chunk.slice(preambleIndex + boundary.length);
      } else {
        continue;
      }
    }
    try {
      yield payload = JSON.parse(chunk.slice(chunk.indexOf('\r\n\r\n') + 4));
    } catch (error) {
      if (!payload) throw error;
    }
    if (payload && payload.hasNext === false) break;
  }
  if (payload && payload.hasNext !== false) {
    yield {
      hasNext: false
    };
  }
}
async function* parseMaybeJSON(response) {
  var text = await response.text();
  try {
    var result = JSON.parse(text);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Found response with content-type "text/plain" but it had a valid "application/json" response.`);
    }
    yield result;
  } catch (e) {
    throw new Error(text);
  }
}
async function* fetchOperation(operation, url, fetchOptions) {
  var networkMode = true;
  var result = null;
  var response;
  try {
    // Delay for a tick to give the Client a chance to cancel the request
    // if a teardown comes in immediately
    yield await Promise.resolve();
    response = await (operation.context.fetch || fetch)(url, fetchOptions);
    var contentType = response.headers.get('Content-Type') || '';
    var results;
    if (/multipart\/mixed/i.test(contentType)) {
      results = parseMultipartMixed(contentType, response);
    } else if (/text\/event-stream/i.test(contentType)) {
      results = parseEventStream(response);
    } else if (!/text\//i.test(contentType)) {
      results = parseJSON(response);
    } else {
      results = parseMaybeJSON(response);
    }
    var pending;
    for await (var payload of results) {
      if (payload.pending && !result) {
        pending = payload.pending;
      } else if (payload.pending) {
        pending = [...pending, ...payload.pending];
      }
      result = result ? mergeResultPatch(result, payload, response, pending) : makeResult(operation, payload, response);
      networkMode = false;
      yield result;
      networkMode = true;
    }
    if (!result) {
      yield result = makeResult(operation, {}, response);
    }
  } catch (error) {
    if (!networkMode) {
      throw error;
    }
    yield makeErrorResult(operation, response && (response.status < 200 || response.status >= 300) && response.statusText ? new Error(response.statusText) : error, response);
  }
}

/** Makes a GraphQL HTTP request to a given API by wrapping around the Fetch API.
 *
 * @param operation - The {@link Operation} that should be sent via GraphQL over HTTP.
 * @param url - The endpoint URL for the GraphQL HTTP API.
 * @param fetchOptions - The {@link RequestInit} fetch options for the request.
 * @returns A Wonka {@link Source} of {@link OperationResult | OperationResults}.
 *
 * @remarks
 * This utility defines how all built-in fetch exchanges make GraphQL HTTP requests,
 * supporting multipart incremental responses, cancellation and other smaller
 * implementation details.
 *
 * If you’re implementing a modified fetch exchange for a GraphQL over HTTP API
 * it’s recommended you use this utility.
 *
 * Hint: This function does not use the passed `operation` to create or modify the
 * `fetchOptions` and instead expects that the options have already been created
 * using {@link makeFetchOptions} and modified as needed.
 *
 * @throws
 * If the `fetch` polyfill or globally available `fetch` function doesn’t support
 * streamed multipart responses while trying to handle a `multipart/mixed` GraphQL response,
 * the source will throw “Streaming requests unsupported”.
 * This shouldn’t happen in modern browsers and Node.js.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} for the Fetch API spec.
 */
function makeFetchSource(operation, url, fetchOptions) {
  var abortController;
  if (typeof AbortController !== 'undefined') {
    fetchOptions.signal = (abortController = new AbortController()).signal;
  }
  return wonka.onEnd(() => {
    if (abortController) abortController.abort();
  })(wonka.filter(result => !!result)(wonka.fromAsyncIterable(fetchOperation(operation, url, fetchOptions))));
}

exports.CombinedError = CombinedError;
exports.createRequest = createRequest;
exports.getOperationName = getOperationName;
exports.getOperationType = getOperationType;
exports.keyDocument = keyDocument;
exports.makeErrorResult = makeErrorResult;
exports.makeFetchBody = makeFetchBody;
exports.makeFetchOptions = makeFetchOptions;
exports.makeFetchSource = makeFetchSource;
exports.makeFetchURL = makeFetchURL;
exports.makeResult = makeResult;
exports.mergeResultPatch = mergeResultPatch;
exports.stringifyDocument = stringifyDocument;
exports.stringifyVariables = stringifyVariables;
//# sourceMappingURL=urql-core-chunk.js.map
