import { GraphQLError as e, print as r, Kind as t, parse as a } from "@0no-co/graphql.web";

import { onEnd as n, filter as o, fromAsyncIterable as s } from "wonka";

var rehydrateGraphQlError = r => {
  if (r && "string" == typeof r.message && (r.extensions || "GraphQLError" === r.name)) {
    return r;
  } else if ("object" == typeof r && "string" == typeof r.message) {
    return new e(r.message, r.nodes, r.source, r.positions, r.path, r, r.extensions || {});
  } else {
    return new e(r);
  }
};

class CombinedError extends Error {
  constructor(e) {
    var r = (e.graphQLErrors || []).map(rehydrateGraphQlError);
    var t = ((e, r) => {
      var t = "";
      if (e) {
        return `[Network] ${e.message}`;
      }
      if (r) {
        for (var a = 0, n = r.length; a < n; a++) {
          if (t) {
            t += "\n";
          }
          t += `[GraphQL] ${r[a].message}`;
        }
      }
      return t;
    })(e.networkError, r);
    super(t);
    this.name = "CombinedError";
    this.message = t;
    this.graphQLErrors = r;
    this.networkError = e.networkError;
    this.response = e.response;
  }
  toString() {
    return this.message;
  }
}

var phash = (e, r) => {
  var t = 0 | (r || 5381);
  for (var a = 0, n = 0 | e.length; a < n; a++) {
    t = (t << 5) + t + e.charCodeAt(a);
  }
  return t;
};

var i = new Set;

var f = new WeakMap;

var stringify = (e, r) => {
  if (null === e || i.has(e)) {
    return "null";
  } else if ("object" != typeof e) {
    return JSON.stringify(e) || "";
  } else if (e.toJSON) {
    return stringify(e.toJSON(), r);
  } else if (Array.isArray(e)) {
    var t = "[";
    for (var a = 0, n = e.length; a < n; a++) {
      if (t.length > 1) {
        t += ",";
      }
      t += stringify(e[a], r) || "null";
    }
    return t += "]";
  } else if (!r && (d !== NoopConstructor && e instanceof d || l !== NoopConstructor && e instanceof l)) {
    return "null";
  }
  var o = Object.keys(e).sort();
  if (!o.length && e.constructor && Object.getPrototypeOf(e).constructor !== Object.prototype.constructor) {
    var s = f.get(e) || Math.random().toString(36).slice(2);
    f.set(e, s);
    return stringify({
      __key: s
    }, r);
  }
  i.add(e);
  var c = "{";
  for (var v = 0, u = o.length; v < u; v++) {
    var p = stringify(e[o[v]], r);
    if (p) {
      if (c.length > 1) {
        c += ",";
      }
      c += stringify(o[v], r) + ":" + p;
    }
  }
  i.delete(e);
  return c += "}";
};

var extract = (e, r, t) => {
  if (null == t || "object" != typeof t || t.toJSON || i.has(t)) {} else if (Array.isArray(t)) {
    for (var a = 0, n = t.length; a < n; a++) {
      extract(e, `${r}.${a}`, t[a]);
    }
  } else if (t instanceof d || t instanceof l) {
    e.set(r, t);
  } else {
    i.add(t);
    for (var o in t) {
      extract(e, `${r}.${o}`, t[o]);
    }
  }
};

var stringifyVariables = (e, r) => {
  i.clear();
  return stringify(e, r || !1);
};

class NoopConstructor {}

var d = "undefined" != typeof File ? File : NoopConstructor;

var l = "undefined" != typeof Blob ? Blob : NoopConstructor;

var c = /("{3}[\s\S]*"{3}|"(?:\\.|[^"])*")/g;

var v = /(?:#[^\n\r]+)?(?:[\r\n]+|$)/g;

var replaceOutsideStrings = (e, r) => r % 2 == 0 ? e.replace(v, "\n") : e;

var sanitizeDocument = e => e.split(c).map(replaceOutsideStrings).join("").trim();

var u = new Map;

var p = new Map;

var stringifyDocument = e => {
  var t;
  if ("string" == typeof e) {
    t = sanitizeDocument(e);
  } else if (e.loc && p.get(e.__key) === e) {
    t = e.loc.source.body;
  } else {
    t = u.get(e) || sanitizeDocument(r(e));
    u.set(e, t);
  }
  if ("string" != typeof e && !e.loc) {
    e.loc = {
      start: 0,
      end: t.length,
      source: {
        body: t,
        name: "gql",
        locationOffset: {
          line: 1,
          column: 1
        }
      }
    };
  }
  return t;
};

var hashDocument = e => {
  var r;
  if (e.documentId) {
    r = phash(e.documentId);
  } else {
    r = phash(stringifyDocument(e));
    if (e.definitions) {
      var t = getOperationName(e);
      if (t) {
        r = phash(`\n# ${t}`, r);
      }
    }
  }
  return r;
};

var keyDocument = e => {
  var r;
  var t;
  if ("string" == typeof e) {
    r = hashDocument(e);
    t = p.get(r) || a(e, {
      noLocation: !0
    });
  } else {
    r = e.__key || hashDocument(e);
    t = p.get(r) || e;
  }
  if (!t.loc) {
    stringifyDocument(t);
  }
  t.__key = r;
  p.set(r, t);
  return t;
};

var createRequest = (e, r, t) => {
  var a = r || {};
  var n = keyDocument(e);
  var o = stringifyVariables(a, !0);
  var s = n.__key;
  if ("{}" !== o) {
    s = phash(o, s);
  }
  return {
    key: s,
    query: n,
    variables: a,
    extensions: t
  };
};

var getOperationName = e => {
  for (var r = 0, a = e.definitions.length; r < a; r++) {
    var n = e.definitions[r];
    if (n.kind === t.OPERATION_DEFINITION) {
      return n.name ? n.name.value : void 0;
    }
  }
};

var getOperationType = e => {
  for (var r = 0, a = e.definitions.length; r < a; r++) {
    var n = e.definitions[r];
    if (n.kind === t.OPERATION_DEFINITION) {
      return n.operation;
    }
  }
};

var makeResult = (e, r, t) => {
  if (!("data" in r || "errors" in r && Array.isArray(r.errors))) {
    throw new Error("No Content");
  }
  var a = "subscription" === e.kind;
  return {
    operation: e,
    data: r.data,
    error: Array.isArray(r.errors) ? new CombinedError({
      graphQLErrors: r.errors,
      response: t
    }) : void 0,
    extensions: r.extensions ? {
      ...r.extensions
    } : void 0,
    hasNext: null == r.hasNext ? a : r.hasNext,
    stale: !1
  };
};

var deepMerge = (e, r) => {
  if ("object" == typeof e && null != e) {
    if (Array.isArray(e)) {
      e = [ ...e ];
      for (var t = 0, a = r.length; t < a; t++) {
        e[t] = deepMerge(e[t], r[t]);
      }
      return e;
    }
    if (!e.constructor || e.constructor === Object) {
      e = {
        ...e
      };
      for (var n in r) {
        e[n] = deepMerge(e[n], r[n]);
      }
      return e;
    }
  }
  return r;
};

var mergeResultPatch = (e, r, t, a) => {
  var n = e.error ? e.error.graphQLErrors : [];
  var o = !!e.extensions || !!(r.payload || r).extensions;
  var s = {
    ...e.extensions,
    ...(r.payload || r).extensions
  };
  var i = r.incremental;
  if ("path" in r) {
    i = [ r ];
  }
  var f = {
    data: e.data
  };
  if (i) {
    var _loop = function() {
      var e = i[d];
      if (Array.isArray(e.errors)) {
        n.push(...e.errors);
      }
      if (e.extensions) {
        Object.assign(s, e.extensions);
        o = !0;
      }
      var r = "data";
      var t = f;
      var l = [];
      if (e.path) {
        l = e.path;
      } else if (a) {
        var c = a.find((r => r.id === e.id));
        if (e.subPath) {
          l = [ ...c.path, ...e.subPath ];
        } else {
          l = c.path;
        }
      }
      for (var v = 0, u = l.length; v < u; r = l[v++]) {
        t = t[r] = Array.isArray(t[r]) ? [ ...t[r] ] : {
          ...t[r]
        };
      }
      if (e.items) {
        var p = +r >= 0 ? r : 0;
        for (var h = 0, y = e.items.length; h < y; h++) {
          t[p + h] = deepMerge(t[p + h], e.items[h]);
        }
      } else if (void 0 !== e.data) {
        t[r] = deepMerge(t[r], e.data);
      }
    };
    for (var d = 0, l = i.length; d < l; d++) {
      _loop();
    }
  } else {
    f.data = (r.payload || r).data || e.data;
    n = r.errors || r.payload && r.payload.errors || n;
  }
  return {
    operation: e.operation,
    data: f.data,
    error: n.length ? new CombinedError({
      graphQLErrors: n,
      response: t
    }) : void 0,
    extensions: o ? s : void 0,
    hasNext: null != r.hasNext ? r.hasNext : e.hasNext,
    stale: !1
  };
};

var makeErrorResult = (e, r, t) => ({
  operation: e,
  data: void 0,
  error: new CombinedError({
    networkError: r,
    response: t
  }),
  extensions: void 0,
  hasNext: !1,
  stale: !1
});

function makeFetchBody(e) {
  var r = {
    query: void 0,
    documentId: void 0,
    operationName: getOperationName(e.query),
    variables: e.variables || void 0,
    extensions: e.extensions
  };
  if ("documentId" in e.query && e.query.documentId && (!e.query.definitions || !e.query.definitions.length)) {
    r.documentId = e.query.documentId;
  } else if (!e.extensions || !e.extensions.persistedQuery || e.extensions.persistedQuery.miss) {
    r.query = stringifyDocument(e.query);
  }
  return r;
}

var makeFetchURL = (e, r) => {
  var t = "query" === e.kind && e.context.preferGetMethod;
  if (!t || !r) {
    return e.context.url;
  }
  var a = splitOutSearchParams(e.context.url);
  for (var n in r) {
    var o = r[n];
    if (o) {
      a[1].set(n, "object" == typeof o ? stringifyVariables(o) : o);
    }
  }
  var s = a.join("?");
  if (s.length > 2047 && "force" !== t) {
    e.context.preferGetMethod = !1;
    return e.context.url;
  }
  return s;
};

var splitOutSearchParams = e => {
  var r = e.indexOf("?");
  return r > -1 ? [ e.slice(0, r), new URLSearchParams(e.slice(r + 1)) ] : [ e, new URLSearchParams ];
};

var serializeBody = (e, r) => {
  if (r && !("query" === e.kind && !!e.context.preferGetMethod)) {
    var t = stringifyVariables(r);
    var a = (e => {
      var r = new Map;
      if (d !== NoopConstructor || l !== NoopConstructor) {
        i.clear();
        extract(r, "variables", e);
      }
      return r;
    })(r.variables);
    if (a.size) {
      var n = new FormData;
      n.append("operations", t);
      n.append("map", stringifyVariables({
        ...[ ...a.keys() ].map((e => [ e ]))
      }));
      var o = 0;
      for (var s of a.values()) {
        n.append("" + o++, s);
      }
      return n;
    }
    return t;
  }
};

var makeFetchOptions = (e, r) => {
  var t = {
    accept: "subscription" === e.kind ? "text/event-stream, multipart/mixed" : "application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed"
  };
  var a = ("function" == typeof e.context.fetchOptions ? e.context.fetchOptions() : e.context.fetchOptions) || {};
  if (a.headers) {
    if ((e => "has" in e && !Object.keys(e).length)(a.headers)) {
      a.headers.forEach(((e, r) => {
        t[r] = e;
      }));
    } else if (Array.isArray(a.headers)) {
      a.headers.forEach(((e, r) => {
        if (Array.isArray(e)) {
          if (t[e[0]]) {
            t[e[0]] = `${t[e[0]]},${e[1]}`;
          } else {
            t[e[0]] = e[1];
          }
        } else {
          t[r] = e;
        }
      }));
    } else {
      for (var n in a.headers) {
        t[n.toLowerCase()] = a.headers[n];
      }
    }
  }
  var o = serializeBody(e, r);
  if ("string" == typeof o && !t["content-type"]) {
    t["content-type"] = "application/json";
  }
  return {
    ...a,
    method: o ? "POST" : "GET",
    body: o,
    headers: t
  };
};

var h = /boundary="?([^=";]+)"?/i;

var y = /data: ?([^\n]+)/;

async function* streamBody(e) {
  if (e.body[Symbol.asyncIterator]) {
    for await (var r of e.body) {
      yield r;
    }
  } else {
    var t = e.body.getReader();
    var a;
    try {
      while (!(a = await t.read()).done) {
        yield a.value;
      }
    } finally {
      t.cancel();
    }
  }
}

async function* streamToBoundedChunks(e, r) {
  var t = "undefined" != typeof TextDecoder ? new TextDecoder : null;
  var a = "";
  var n;
  for await (var o of e) {
    a += "Buffer" === o.constructor.name ? o.toString() : t.decode(o, {
      stream: !0
    });
    while ((n = a.indexOf(r)) > -1) {
      yield a.slice(0, n);
      a = a.slice(n + r.length);
    }
  }
}

async function* fetchOperation(e, r, t) {
  var a = !0;
  var n = null;
  var o;
  try {
    yield await Promise.resolve();
    var s = (o = await (e.context.fetch || fetch)(r, t)).headers.get("Content-Type") || "";
    var i;
    if (/multipart\/mixed/i.test(s)) {
      i = async function* parseMultipartMixed(e, r) {
        var t = e.match(h);
        var a = "--" + (t ? t[1] : "-");
        var n = !0;
        var o;
        for await (var s of streamToBoundedChunks(streamBody(r), "\r\n" + a)) {
          if (n) {
            n = !1;
            var i = s.indexOf(a);
            if (i > -1) {
              s = s.slice(i + a.length);
            } else {
              continue;
            }
          }
          try {
            yield o = JSON.parse(s.slice(s.indexOf("\r\n\r\n") + 4));
          } catch (e) {
            if (!o) {
              throw e;
            }
          }
          if (o && !1 === o.hasNext) {
            break;
          }
        }
        if (o && !1 !== o.hasNext) {
          yield {
            hasNext: !1
          };
        }
      }(s, o);
    } else if (/text\/event-stream/i.test(s)) {
      i = async function* parseEventStream(e) {
        var r;
        for await (var t of streamToBoundedChunks(streamBody(e), "\n\n")) {
          var a = t.match(y);
          if (a) {
            var n = a[1];
            try {
              yield r = JSON.parse(n);
            } catch (e) {
              if (!r) {
                throw e;
              }
            }
            if (r && !1 === r.hasNext) {
              break;
            }
          }
        }
        if (r && !1 !== r.hasNext) {
          yield {
            hasNext: !1
          };
        }
      }(o);
    } else if (!/text\//i.test(s)) {
      i = async function* parseJSON(e) {
        yield JSON.parse(await e.text());
      }(o);
    } else {
      i = async function* parseMaybeJSON(e) {
        var r = await e.text();
        try {
          var t = JSON.parse(r);
          if ("production" !== process.env.NODE_ENV) {
            console.warn('Found response with content-type "text/plain" but it had a valid "application/json" response.');
          }
          yield t;
        } catch (e) {
          throw new Error(r);
        }
      }(o);
    }
    var f;
    for await (var d of i) {
      if (d.pending && !n) {
        f = d.pending;
      } else if (d.pending) {
        f = [ ...f, ...d.pending ];
      }
      n = n ? mergeResultPatch(n, d, o, f) : makeResult(e, d, o);
      a = !1;
      yield n;
      a = !0;
    }
    if (!n) {
      yield n = makeResult(e, {}, o);
    }
  } catch (r) {
    if (!a) {
      throw r;
    }
    yield makeErrorResult(e, o && (o.status < 200 || o.status >= 300) && o.statusText ? new Error(o.statusText) : r, o);
  }
}

function makeFetchSource(e, r, t) {
  var a;
  if ("undefined" != typeof AbortController) {
    t.signal = (a = new AbortController).signal;
  }
  return n((() => {
    if (a) {
      a.abort();
    }
  }))(o((e => !!e))(s(fetchOperation(e, r, t))));
}

export { CombinedError as C, makeFetchBody as a, makeErrorResult as b, mergeResultPatch as c, makeFetchURL as d, makeFetchOptions as e, makeFetchSource as f, getOperationType as g, createRequest as h, stringifyVariables as i, getOperationName as j, keyDocument as k, makeResult as m, stringifyDocument as s };
//# sourceMappingURL=urql-core-chunk.mjs.map
