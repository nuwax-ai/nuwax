var e = {
  NAME: "Name",
  DOCUMENT: "Document",
  OPERATION_DEFINITION: "OperationDefinition",
  VARIABLE_DEFINITION: "VariableDefinition",
  SELECTION_SET: "SelectionSet",
  FIELD: "Field",
  ARGUMENT: "Argument",
  FRAGMENT_SPREAD: "FragmentSpread",
  INLINE_FRAGMENT: "InlineFragment",
  FRAGMENT_DEFINITION: "FragmentDefinition",
  VARIABLE: "Variable",
  INT: "IntValue",
  FLOAT: "FloatValue",
  STRING: "StringValue",
  BOOLEAN: "BooleanValue",
  NULL: "NullValue",
  ENUM: "EnumValue",
  LIST: "ListValue",
  OBJECT: "ObjectValue",
  OBJECT_FIELD: "ObjectField",
  DIRECTIVE: "Directive",
  NAMED_TYPE: "NamedType",
  LIST_TYPE: "ListType",
  NON_NULL_TYPE: "NonNullType"
};

var r = {
  QUERY: "query",
  MUTATION: "mutation",
  SUBSCRIPTION: "subscription"
};

class GraphQLError extends Error {
  constructor(e, r, i, n, t, a, o) {
    if (super(e), this.name = "GraphQLError", this.message = e, t) {
      this.path = t;
    }
    if (r) {
      this.nodes = Array.isArray(r) ? r : [ r ];
    }
    if (i) {
      this.source = i;
    }
    if (n) {
      this.positions = n;
    }
    if (a) {
      this.originalError = a;
    }
    var l = o;
    if (!l && a) {
      var d = a.extensions;
      if (d && "object" == typeof d) {
        l = d;
      }
    }
    this.extensions = l || {};
  }
  toJSON() {
    return {
      ...this,
      message: this.message
    };
  }
  toString() {
    return this.message;
  }
  get [Symbol.toStringTag]() {
    return "GraphQLError";
  }
}

var i;

var n;

function error(e) {
  return new GraphQLError(`Syntax Error: Unexpected token at ${n} in ${e}`);
}

function advance(e) {
  if (e.lastIndex = n, e.test(i)) {
    return i.slice(n, n = e.lastIndex);
  }
}

var t = / +(?=[^\s])/y;

function blockString(e) {
  var r = e.split("\n");
  var i = "";
  var n = 0;
  var a = 0;
  var o = r.length - 1;
  for (var l = 0; l < r.length; l++) {
    if (t.lastIndex = 0, t.test(r[l])) {
      if (l && (!n || t.lastIndex < n)) {
        n = t.lastIndex;
      }
      a = a || l, o = l;
    }
  }
  for (var d = a; d <= o; d++) {
    if (d !== a) {
      i += "\n";
    }
    i += r[d].slice(n).replace(/\\"""/g, '"""');
  }
  return i;
}

function ignored() {
  for (var e = 0 | i.charCodeAt(n++); 9 === e || 10 === e || 13 === e || 32 === e || 35 === e || 44 === e || 65279 === e; e = 0 | i.charCodeAt(n++)) {
    if (35 === e) {
      for (;(e = 0 | i.charCodeAt(n++)) && 10 !== e && 13 !== e; ) {}
    }
  }
  n--;
}

function name() {
  var e = n;
  for (var r = 0 | i.charCodeAt(n++); r >= 48 && r <= 57 || r >= 65 && r <= 90 || 95 === r || r >= 97 && r <= 122; r = 0 | i.charCodeAt(n++)) {}
  if (e === n - 1) {
    throw error("Name");
  }
  var t = i.slice(e, --n);
  return ignored(), t;
}

function nameNode() {
  return {
    kind: "Name",
    value: name()
  };
}

var a = /(?:"""|(?:[\s\S]*?[^\\])""")/y;

var o = /(?:(?:\.\d+)?[eE][+-]?\d+|\.\d+)/y;

function value(e) {
  var r;
  switch (i.charCodeAt(n)) {
   case 91:
    n++, ignored();
    var t = [];
    for (;93 !== i.charCodeAt(n); ) {
      t.push(value(e));
    }
    return n++, ignored(), {
      kind: "ListValue",
      values: t
    };

   case 123:
    n++, ignored();
    var l = [];
    for (;125 !== i.charCodeAt(n); ) {
      var d = nameNode();
      if (58 !== i.charCodeAt(n++)) {
        throw error("ObjectField");
      }
      ignored(), l.push({
        kind: "ObjectField",
        name: d,
        value: value(e)
      });
    }
    return n++, ignored(), {
      kind: "ObjectValue",
      fields: l
    };

   case 36:
    if (e) {
      throw error("Variable");
    }
    return n++, {
      kind: "Variable",
      name: nameNode()
    };

   case 34:
    if (34 === i.charCodeAt(n + 1) && 34 === i.charCodeAt(n + 2)) {
      if (n += 3, null == (r = advance(a))) {
        throw error("StringValue");
      }
      return ignored(), {
        kind: "StringValue",
        value: blockString(r.slice(0, -3)),
        block: !0
      };
    } else {
      var u = n;
      var s;
      n++;
      var c = !1;
      for (s = 0 | i.charCodeAt(n++); 92 === s && (n++, c = !0) || 10 !== s && 13 !== s && 34 !== s && s; s = 0 | i.charCodeAt(n++)) {}
      if (34 !== s) {
        throw error("StringValue");
      }
      return r = i.slice(u, n), ignored(), {
        kind: "StringValue",
        value: c ? JSON.parse(r) : r.slice(1, -1),
        block: !1
      };
    }

   case 45:
   case 48:
   case 49:
   case 50:
   case 51:
   case 52:
   case 53:
   case 54:
   case 55:
   case 56:
   case 57:
    var v = n++;
    var f;
    for (;(f = 0 | i.charCodeAt(n++)) >= 48 && f <= 57; ) {}
    var m = i.slice(v, --n);
    if (46 === (f = i.charCodeAt(n)) || 69 === f || 101 === f) {
      if (null == (r = advance(o))) {
        throw error("FloatValue");
      }
      return ignored(), {
        kind: "FloatValue",
        value: m + r
      };
    } else {
      return ignored(), {
        kind: "IntValue",
        value: m
      };
    }

   case 110:
    if (117 === i.charCodeAt(n + 1) && 108 === i.charCodeAt(n + 2) && 108 === i.charCodeAt(n + 3)) {
      return n += 4, ignored(), {
        kind: "NullValue"
      };
    } else {
      break;
    }

   case 116:
    if (114 === i.charCodeAt(n + 1) && 117 === i.charCodeAt(n + 2) && 101 === i.charCodeAt(n + 3)) {
      return n += 4, ignored(), {
        kind: "BooleanValue",
        value: !0
      };
    } else {
      break;
    }

   case 102:
    if (97 === i.charCodeAt(n + 1) && 108 === i.charCodeAt(n + 2) && 115 === i.charCodeAt(n + 3) && 101 === i.charCodeAt(n + 4)) {
      return n += 5, ignored(), {
        kind: "BooleanValue",
        value: !1
      };
    } else {
      break;
    }
  }
  return {
    kind: "EnumValue",
    value: name()
  };
}

function arguments_(e) {
  if (40 === i.charCodeAt(n)) {
    var r = [];
    n++, ignored();
    do {
      var t = nameNode();
      if (58 !== i.charCodeAt(n++)) {
        throw error("Argument");
      }
      ignored(), r.push({
        kind: "Argument",
        name: t,
        value: value(e)
      });
    } while (41 !== i.charCodeAt(n));
    return n++, ignored(), r;
  }
}

function directives(e) {
  if (64 === i.charCodeAt(n)) {
    var r = [];
    do {
      n++, r.push({
        kind: "Directive",
        name: nameNode(),
        arguments: arguments_(e)
      });
    } while (64 === i.charCodeAt(n));
    return r;
  }
}

function type() {
  var e = 0;
  for (;91 === i.charCodeAt(n); ) {
    e++, n++, ignored();
  }
  var r = {
    kind: "NamedType",
    name: nameNode()
  };
  do {
    if (33 === i.charCodeAt(n)) {
      n++, ignored(), r = {
        kind: "NonNullType",
        type: r
      };
    }
    if (e) {
      if (93 !== i.charCodeAt(n++)) {
        throw error("NamedType");
      }
      ignored(), r = {
        kind: "ListType",
        type: r
      };
    }
  } while (e--);
  return r;
}

function selectionSetStart() {
  if (123 !== i.charCodeAt(n++)) {
    throw error("SelectionSet");
  }
  return ignored(), selectionSet();
}

function selectionSet() {
  var e = [];
  do {
    if (46 === i.charCodeAt(n)) {
      if (46 !== i.charCodeAt(++n) || 46 !== i.charCodeAt(++n)) {
        throw error("SelectionSet");
      }
      switch (n++, ignored(), i.charCodeAt(n)) {
       case 64:
        e.push({
          kind: "InlineFragment",
          typeCondition: void 0,
          directives: directives(!1),
          selectionSet: selectionSetStart()
        });
        break;

       case 111:
        if (110 === i.charCodeAt(n + 1)) {
          n += 2, ignored(), e.push({
            kind: "InlineFragment",
            typeCondition: {
              kind: "NamedType",
              name: nameNode()
            },
            directives: directives(!1),
            selectionSet: selectionSetStart()
          });
        } else {
          e.push({
            kind: "FragmentSpread",
            name: nameNode(),
            directives: directives(!1)
          });
        }
        break;

       case 123:
        n++, ignored(), e.push({
          kind: "InlineFragment",
          typeCondition: void 0,
          directives: void 0,
          selectionSet: selectionSet()
        });
        break;

       default:
        e.push({
          kind: "FragmentSpread",
          name: nameNode(),
          directives: directives(!1)
        });
      }
    } else {
      var r = nameNode();
      var t = void 0;
      if (58 === i.charCodeAt(n)) {
        n++, ignored(), t = r, r = nameNode();
      }
      var a = arguments_(!1);
      var o = directives(!1);
      var l = void 0;
      if (123 === i.charCodeAt(n)) {
        n++, ignored(), l = selectionSet();
      }
      e.push({
        kind: "Field",
        alias: t,
        name: r,
        arguments: a,
        directives: o,
        selectionSet: l
      });
    }
  } while (125 !== i.charCodeAt(n));
  return n++, ignored(), {
    kind: "SelectionSet",
    selections: e
  };
}

function variableDefinitions() {
  if (ignored(), 40 === i.charCodeAt(n)) {
    var e = [];
    n++, ignored();
    do {
      var r = void 0;
      if (34 === i.charCodeAt(n)) {
        r = value(!0);
      }
      if (36 !== i.charCodeAt(n++)) {
        throw error("Variable");
      }
      var t = nameNode();
      if (58 !== i.charCodeAt(n++)) {
        throw error("VariableDefinition");
      }
      ignored();
      var a = type();
      var o = void 0;
      if (61 === i.charCodeAt(n)) {
        n++, ignored(), o = value(!0);
      }
      ignored();
      var l = {
        kind: "VariableDefinition",
        variable: {
          kind: "Variable",
          name: t
        },
        type: a,
        defaultValue: o,
        directives: directives(!0)
      };
      if (r) {
        l.description = r;
      }
      e.push(l);
    } while (41 !== i.charCodeAt(n));
    return n++, ignored(), e;
  }
}

function fragmentDefinition(e) {
  var r = nameNode();
  if (111 !== i.charCodeAt(n++) || 110 !== i.charCodeAt(n++)) {
    throw error("FragmentDefinition");
  }
  ignored();
  var t = {
    kind: "FragmentDefinition",
    name: r,
    typeCondition: {
      kind: "NamedType",
      name: nameNode()
    },
    directives: directives(!1),
    selectionSet: selectionSetStart()
  };
  if (e) {
    t.description = e;
  }
  return t;
}

function definitions() {
  var e = [];
  do {
    var r = void 0;
    if (34 === i.charCodeAt(n)) {
      r = value(!0);
    }
    if (123 === i.charCodeAt(n)) {
      if (r) {
        throw error("Document");
      }
      n++, ignored(), e.push({
        kind: "OperationDefinition",
        operation: "query",
        name: void 0,
        variableDefinitions: void 0,
        directives: void 0,
        selectionSet: selectionSet()
      });
    } else {
      var t = name();
      switch (t) {
       case "fragment":
        e.push(fragmentDefinition(r));
        break;

       case "query":
       case "mutation":
       case "subscription":
        var a;
        var o = void 0;
        if (40 !== (a = i.charCodeAt(n)) && 64 !== a && 123 !== a) {
          o = nameNode();
        }
        var l = {
          kind: "OperationDefinition",
          operation: t,
          name: o,
          variableDefinitions: variableDefinitions(),
          directives: directives(!1),
          selectionSet: selectionSetStart()
        };
        if (r) {
          l.description = r;
        }
        e.push(l);
        break;

       default:
        throw error("Document");
      }
    }
  } while (n < i.length);
  return e;
}

function parse(e, r) {
  if (i = e.body ? e.body : e, n = 0, ignored(), r && r.noLocation) {
    return {
      kind: "Document",
      definitions: definitions()
    };
  } else {
    return {
      kind: "Document",
      definitions: definitions(),
      loc: {
        start: 0,
        end: i.length,
        startToken: void 0,
        endToken: void 0,
        source: {
          body: i,
          name: "graphql.web",
          locationOffset: {
            line: 1,
            column: 1
          }
        }
      }
    };
  }
}

function parseValue(e, r) {
  return i = e.body ? e.body : e, n = 0, ignored(), value(!1);
}

function parseType(e, r) {
  return i = e.body ? e.body : e, n = 0, type();
}

var l = {};

function visit(e, r) {
  var i = [];
  var n = [];
  try {
    var t = function traverse(e, t, a) {
      var o = !1;
      var d = r[e.kind] && r[e.kind].enter || r[e.kind] || r.enter;
      var u = d && d.call(r, e, t, a, n, i);
      if (!1 === u) {
        return e;
      } else if (null === u) {
        return null;
      } else if (u === l) {
        throw l;
      } else if (u && "string" == typeof u.kind) {
        o = u !== e, e = u;
      }
      if (a) {
        i.push(a);
      }
      var s;
      var c = {
        ...e
      };
      for (var v in e) {
        n.push(v);
        var f = e[v];
        if (Array.isArray(f)) {
          var m = [];
          for (var p = 0; p < f.length; p++) {
            if (null != f[p] && "string" == typeof f[p].kind) {
              if (i.push(e), n.push(p), s = traverse(f[p], p, f), n.pop(), i.pop(), null == s) {
                o = !0;
              } else {
                o = o || s !== f[p], m.push(s);
              }
            }
          }
          f = m;
        } else if (null != f && "string" == typeof f.kind) {
          if (void 0 !== (s = traverse(f, v, e))) {
            o = o || f !== s, f = s;
          }
        }
        if (n.pop(), o) {
          c[v] = f;
        }
      }
      if (a) {
        i.pop();
      }
      var h = r[e.kind] && r[e.kind].leave || r.leave;
      var g = h && h.call(r, e, t, a, n, i);
      if (g === l) {
        throw l;
      } else if (void 0 !== g) {
        return g;
      } else if (void 0 !== u) {
        return o ? c : u;
      } else {
        return o ? c : e;
      }
    }(e);
    return void 0 !== t && !1 !== t ? t : e;
  } catch (r) {
    if (r !== l) {
      throw r;
    }
    return e;
  }
}

function mapJoin(e, r, i) {
  var n = "";
  for (var t = 0; t < e.length; t++) {
    if (t) {
      n += r;
    }
    n += i(e[t]);
  }
  return n;
}

function printString(e) {
  return JSON.stringify(e);
}

function printBlockString(e) {
  return '"""\n' + e.replace(/"""/g, '\\"""') + '\n"""';
}

var d = "\n";

var u = {
  OperationDefinition(e) {
    var r = "";
    if (e.description) {
      r += u.StringValue(e.description) + "\n";
    }
    if (r += e.operation, e.name) {
      r += " " + e.name.value;
    }
    if (e.variableDefinitions && e.variableDefinitions.length) {
      if (!e.name) {
        r += " ";
      }
      r += "(" + mapJoin(e.variableDefinitions, ", ", u.VariableDefinition) + ")";
    }
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", u.Directive);
    }
    var i = u.SelectionSet(e.selectionSet);
    return "query" !== r ? r + " " + i : i;
  },
  VariableDefinition(e) {
    var r = "";
    if (e.description) {
      r += u.StringValue(e.description) + " ";
    }
    if (r += u.Variable(e.variable) + ": " + _print(e.type), e.defaultValue) {
      r += " = " + _print(e.defaultValue);
    }
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", u.Directive);
    }
    return r;
  },
  Field(e) {
    var r = e.alias ? e.alias.value + ": " + e.name.value : e.name.value;
    if (e.arguments && e.arguments.length) {
      var i = mapJoin(e.arguments, ", ", u.Argument);
      if (r.length + i.length + 2 > 80) {
        r += "(" + (d += "  ") + mapJoin(e.arguments, d, u.Argument) + (d = d.slice(0, -2)) + ")";
      } else {
        r += "(" + i + ")";
      }
    }
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", u.Directive);
    }
    if (e.selectionSet && e.selectionSet.selections.length) {
      r += " " + u.SelectionSet(e.selectionSet);
    }
    return r;
  },
  StringValue(e) {
    if (e.block) {
      return printBlockString(e.value).replace(/\n/g, d);
    } else {
      return printString(e.value);
    }
  },
  BooleanValue: e => "" + e.value,
  NullValue: e => "null",
  IntValue: e => e.value,
  FloatValue: e => e.value,
  EnumValue: e => e.value,
  Name: e => e.value,
  Variable: e => "$" + e.name.value,
  ListValue: e => "[" + mapJoin(e.values, ", ", _print) + "]",
  ObjectValue: e => "{" + mapJoin(e.fields, ", ", u.ObjectField) + "}",
  ObjectField: e => e.name.value + ": " + _print(e.value),
  Document(e) {
    if (!e.definitions || !e.definitions.length) {
      return "";
    } else {
      return mapJoin(e.definitions, "\n\n", _print);
    }
  },
  SelectionSet: e => "{" + (d += "  ") + mapJoin(e.selections, d, _print) + (d = d.slice(0, -2)) + "}",
  Argument: e => e.name.value + ": " + _print(e.value),
  FragmentSpread(e) {
    var r = "..." + e.name.value;
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", u.Directive);
    }
    return r;
  },
  InlineFragment(e) {
    var r = "...";
    if (e.typeCondition) {
      r += " on " + e.typeCondition.name.value;
    }
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", u.Directive);
    }
    return r += " " + u.SelectionSet(e.selectionSet);
  },
  FragmentDefinition(e) {
    var r = "";
    if (e.description) {
      r += u.StringValue(e.description) + "\n";
    }
    if (r += "fragment " + e.name.value, r += " on " + e.typeCondition.name.value, e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", u.Directive);
    }
    return r + " " + u.SelectionSet(e.selectionSet);
  },
  Directive(e) {
    var r = "@" + e.name.value;
    if (e.arguments && e.arguments.length) {
      r += "(" + mapJoin(e.arguments, ", ", u.Argument) + ")";
    }
    return r;
  },
  NamedType: e => e.name.value,
  ListType: e => "[" + _print(e.type) + "]",
  NonNullType: e => _print(e.type) + "!"
};

var _print = e => u[e.kind](e);

function print(e) {
  return d = "\n", u[e.kind] ? u[e.kind](e) : "";
}

function valueFromASTUntyped(e, r) {
  switch (e.kind) {
   case "NullValue":
    return null;

   case "IntValue":
    return parseInt(e.value, 10);

   case "FloatValue":
    return parseFloat(e.value);

   case "StringValue":
   case "EnumValue":
   case "BooleanValue":
    return e.value;

   case "ListValue":
    var i = [];
    for (var n = 0, t = e.values.length; n < t; n++) {
      i.push(valueFromASTUntyped(e.values[n], r));
    }
    return i;

   case "ObjectValue":
    var a = Object.create(null);
    for (var o = 0, l = e.fields.length; o < l; o++) {
      var d = e.fields[o];
      a[d.name.value] = valueFromASTUntyped(d.value, r);
    }
    return a;

   case "Variable":
    return r && r[e.name.value];
  }
}

function valueFromTypeNode(e, r, i) {
  if ("Variable" === e.kind) {
    return i ? valueFromTypeNode(i[e.name.value], r, i) : void 0;
  } else if ("NonNullType" === r.kind) {
    return "NullValue" !== e.kind ? valueFromTypeNode(e, r, i) : void 0;
  } else if ("NullValue" === e.kind) {
    return null;
  } else if ("ListType" === r.kind) {
    if ("ListValue" === e.kind) {
      var n = [];
      for (var t = 0, a = e.values.length; t < a; t++) {
        var o = valueFromTypeNode(e.values[t], r.type, i);
        if (void 0 === o) {
          return;
        } else {
          n.push(o);
        }
      }
      return n;
    }
  } else if ("NamedType" === r.kind) {
    switch (r.name.value) {
     case "Int":
     case "Float":
     case "String":
     case "Bool":
      return r.name.value + "Value" === e.kind ? valueFromASTUntyped(e, i) : void 0;

     default:
      return valueFromASTUntyped(e, i);
    }
  }
}

function isSelectionNode(e) {
  return "Field" === e.kind || "FragmentSpread" === e.kind || "InlineFragment" === e.kind;
}

function Source(e, r, i) {
  return {
    body: e,
    name: r,
    locationOffset: i || {
      line: 1,
      column: 1
    }
  };
}

export { l as BREAK, GraphQLError, e as Kind, r as OperationTypeNode, Source, isSelectionNode, parse, parseType, parseValue, print, printBlockString, printString, valueFromASTUntyped, valueFromTypeNode, visit };
//# sourceMappingURL=graphql.web.mjs.map
