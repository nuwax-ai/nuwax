Object.defineProperty(exports, "__esModule", {
  value: !0
});

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

var e;

var r;

function error(e) {
  return new GraphQLError(`Syntax Error: Unexpected token at ${r} in ${e}`);
}

function advance(i) {
  if (i.lastIndex = r, i.test(e)) {
    return e.slice(r, r = i.lastIndex);
  }
}

var i = / +(?=[^\s])/y;

function blockString(e) {
  var r = e.split("\n");
  var n = "";
  var t = 0;
  var a = 0;
  var o = r.length - 1;
  for (var l = 0; l < r.length; l++) {
    if (i.lastIndex = 0, i.test(r[l])) {
      if (l && (!t || i.lastIndex < t)) {
        t = i.lastIndex;
      }
      a = a || l, o = l;
    }
  }
  for (var d = a; d <= o; d++) {
    if (d !== a) {
      n += "\n";
    }
    n += r[d].slice(t).replace(/\\"""/g, '"""');
  }
  return n;
}

function ignored() {
  for (var i = 0 | e.charCodeAt(r++); 9 === i || 10 === i || 13 === i || 32 === i || 35 === i || 44 === i || 65279 === i; i = 0 | e.charCodeAt(r++)) {
    if (35 === i) {
      for (;(i = 0 | e.charCodeAt(r++)) && 10 !== i && 13 !== i; ) {}
    }
  }
  r--;
}

function name() {
  var i = r;
  for (var n = 0 | e.charCodeAt(r++); n >= 48 && n <= 57 || n >= 65 && n <= 90 || 95 === n || n >= 97 && n <= 122; n = 0 | e.charCodeAt(r++)) {}
  if (i === r - 1) {
    throw error("Name");
  }
  var t = e.slice(i, --r);
  return ignored(), t;
}

function nameNode() {
  return {
    kind: "Name",
    value: name()
  };
}

var n = /(?:"""|(?:[\s\S]*?[^\\])""")/y;

var t = /(?:(?:\.\d+)?[eE][+-]?\d+|\.\d+)/y;

function value(i) {
  var a;
  switch (e.charCodeAt(r)) {
   case 91:
    r++, ignored();
    var o = [];
    for (;93 !== e.charCodeAt(r); ) {
      o.push(value(i));
    }
    return r++, ignored(), {
      kind: "ListValue",
      values: o
    };

   case 123:
    r++, ignored();
    var l = [];
    for (;125 !== e.charCodeAt(r); ) {
      var d = nameNode();
      if (58 !== e.charCodeAt(r++)) {
        throw error("ObjectField");
      }
      ignored(), l.push({
        kind: "ObjectField",
        name: d,
        value: value(i)
      });
    }
    return r++, ignored(), {
      kind: "ObjectValue",
      fields: l
    };

   case 36:
    if (i) {
      throw error("Variable");
    }
    return r++, {
      kind: "Variable",
      name: nameNode()
    };

   case 34:
    if (34 === e.charCodeAt(r + 1) && 34 === e.charCodeAt(r + 2)) {
      if (r += 3, null == (a = advance(n))) {
        throw error("StringValue");
      }
      return ignored(), {
        kind: "StringValue",
        value: blockString(a.slice(0, -3)),
        block: !0
      };
    } else {
      var s = r;
      var u;
      r++;
      var c = !1;
      for (u = 0 | e.charCodeAt(r++); 92 === u && (r++, c = !0) || 10 !== u && 13 !== u && 34 !== u && u; u = 0 | e.charCodeAt(r++)) {}
      if (34 !== u) {
        throw error("StringValue");
      }
      return a = e.slice(s, r), ignored(), {
        kind: "StringValue",
        value: c ? JSON.parse(a) : a.slice(1, -1),
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
    var v = r++;
    var f;
    for (;(f = 0 | e.charCodeAt(r++)) >= 48 && f <= 57; ) {}
    var p = e.slice(v, --r);
    if (46 === (f = e.charCodeAt(r)) || 69 === f || 101 === f) {
      if (null == (a = advance(t))) {
        throw error("FloatValue");
      }
      return ignored(), {
        kind: "FloatValue",
        value: p + a
      };
    } else {
      return ignored(), {
        kind: "IntValue",
        value: p
      };
    }

   case 110:
    if (117 === e.charCodeAt(r + 1) && 108 === e.charCodeAt(r + 2) && 108 === e.charCodeAt(r + 3)) {
      return r += 4, ignored(), {
        kind: "NullValue"
      };
    } else {
      break;
    }

   case 116:
    if (114 === e.charCodeAt(r + 1) && 117 === e.charCodeAt(r + 2) && 101 === e.charCodeAt(r + 3)) {
      return r += 4, ignored(), {
        kind: "BooleanValue",
        value: !0
      };
    } else {
      break;
    }

   case 102:
    if (97 === e.charCodeAt(r + 1) && 108 === e.charCodeAt(r + 2) && 115 === e.charCodeAt(r + 3) && 101 === e.charCodeAt(r + 4)) {
      return r += 5, ignored(), {
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

function arguments_(i) {
  if (40 === e.charCodeAt(r)) {
    var n = [];
    r++, ignored();
    do {
      var t = nameNode();
      if (58 !== e.charCodeAt(r++)) {
        throw error("Argument");
      }
      ignored(), n.push({
        kind: "Argument",
        name: t,
        value: value(i)
      });
    } while (41 !== e.charCodeAt(r));
    return r++, ignored(), n;
  }
}

function directives(i) {
  if (64 === e.charCodeAt(r)) {
    var n = [];
    do {
      r++, n.push({
        kind: "Directive",
        name: nameNode(),
        arguments: arguments_(i)
      });
    } while (64 === e.charCodeAt(r));
    return n;
  }
}

function type() {
  var i = 0;
  for (;91 === e.charCodeAt(r); ) {
    i++, r++, ignored();
  }
  var n = {
    kind: "NamedType",
    name: nameNode()
  };
  do {
    if (33 === e.charCodeAt(r)) {
      r++, ignored(), n = {
        kind: "NonNullType",
        type: n
      };
    }
    if (i) {
      if (93 !== e.charCodeAt(r++)) {
        throw error("NamedType");
      }
      ignored(), n = {
        kind: "ListType",
        type: n
      };
    }
  } while (i--);
  return n;
}

function selectionSetStart() {
  if (123 !== e.charCodeAt(r++)) {
    throw error("SelectionSet");
  }
  return ignored(), selectionSet();
}

function selectionSet() {
  var i = [];
  do {
    if (46 === e.charCodeAt(r)) {
      if (46 !== e.charCodeAt(++r) || 46 !== e.charCodeAt(++r)) {
        throw error("SelectionSet");
      }
      switch (r++, ignored(), e.charCodeAt(r)) {
       case 64:
        i.push({
          kind: "InlineFragment",
          typeCondition: void 0,
          directives: directives(!1),
          selectionSet: selectionSetStart()
        });
        break;

       case 111:
        if (110 === e.charCodeAt(r + 1)) {
          r += 2, ignored(), i.push({
            kind: "InlineFragment",
            typeCondition: {
              kind: "NamedType",
              name: nameNode()
            },
            directives: directives(!1),
            selectionSet: selectionSetStart()
          });
        } else {
          i.push({
            kind: "FragmentSpread",
            name: nameNode(),
            directives: directives(!1)
          });
        }
        break;

       case 123:
        r++, ignored(), i.push({
          kind: "InlineFragment",
          typeCondition: void 0,
          directives: void 0,
          selectionSet: selectionSet()
        });
        break;

       default:
        i.push({
          kind: "FragmentSpread",
          name: nameNode(),
          directives: directives(!1)
        });
      }
    } else {
      var n = nameNode();
      var t = void 0;
      if (58 === e.charCodeAt(r)) {
        r++, ignored(), t = n, n = nameNode();
      }
      var a = arguments_(!1);
      var o = directives(!1);
      var l = void 0;
      if (123 === e.charCodeAt(r)) {
        r++, ignored(), l = selectionSet();
      }
      i.push({
        kind: "Field",
        alias: t,
        name: n,
        arguments: a,
        directives: o,
        selectionSet: l
      });
    }
  } while (125 !== e.charCodeAt(r));
  return r++, ignored(), {
    kind: "SelectionSet",
    selections: i
  };
}

function variableDefinitions() {
  if (ignored(), 40 === e.charCodeAt(r)) {
    var i = [];
    r++, ignored();
    do {
      var n = void 0;
      if (34 === e.charCodeAt(r)) {
        n = value(!0);
      }
      if (36 !== e.charCodeAt(r++)) {
        throw error("Variable");
      }
      var t = nameNode();
      if (58 !== e.charCodeAt(r++)) {
        throw error("VariableDefinition");
      }
      ignored();
      var a = type();
      var o = void 0;
      if (61 === e.charCodeAt(r)) {
        r++, ignored(), o = value(!0);
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
      if (n) {
        l.description = n;
      }
      i.push(l);
    } while (41 !== e.charCodeAt(r));
    return r++, ignored(), i;
  }
}

function fragmentDefinition(i) {
  var n = nameNode();
  if (111 !== e.charCodeAt(r++) || 110 !== e.charCodeAt(r++)) {
    throw error("FragmentDefinition");
  }
  ignored();
  var t = {
    kind: "FragmentDefinition",
    name: n,
    typeCondition: {
      kind: "NamedType",
      name: nameNode()
    },
    directives: directives(!1),
    selectionSet: selectionSetStart()
  };
  if (i) {
    t.description = i;
  }
  return t;
}

function definitions() {
  var i = [];
  do {
    var n = void 0;
    if (34 === e.charCodeAt(r)) {
      n = value(!0);
    }
    if (123 === e.charCodeAt(r)) {
      if (n) {
        throw error("Document");
      }
      r++, ignored(), i.push({
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
        i.push(fragmentDefinition(n));
        break;

       case "query":
       case "mutation":
       case "subscription":
        var a;
        var o = void 0;
        if (40 !== (a = e.charCodeAt(r)) && 64 !== a && 123 !== a) {
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
        if (n) {
          l.description = n;
        }
        i.push(l);
        break;

       default:
        throw error("Document");
      }
    }
  } while (r < e.length);
  return i;
}

var a = {};

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

var o = "\n";

var l = {
  OperationDefinition(e) {
    var r = "";
    if (e.description) {
      r += l.StringValue(e.description) + "\n";
    }
    if (r += e.operation, e.name) {
      r += " " + e.name.value;
    }
    if (e.variableDefinitions && e.variableDefinitions.length) {
      if (!e.name) {
        r += " ";
      }
      r += "(" + mapJoin(e.variableDefinitions, ", ", l.VariableDefinition) + ")";
    }
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", l.Directive);
    }
    var i = l.SelectionSet(e.selectionSet);
    return "query" !== r ? r + " " + i : i;
  },
  VariableDefinition(e) {
    var r = "";
    if (e.description) {
      r += l.StringValue(e.description) + " ";
    }
    if (r += l.Variable(e.variable) + ": " + _print(e.type), e.defaultValue) {
      r += " = " + _print(e.defaultValue);
    }
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", l.Directive);
    }
    return r;
  },
  Field(e) {
    var r = e.alias ? e.alias.value + ": " + e.name.value : e.name.value;
    if (e.arguments && e.arguments.length) {
      var i = mapJoin(e.arguments, ", ", l.Argument);
      if (r.length + i.length + 2 > 80) {
        r += "(" + (o += "  ") + mapJoin(e.arguments, o, l.Argument) + (o = o.slice(0, -2)) + ")";
      } else {
        r += "(" + i + ")";
      }
    }
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", l.Directive);
    }
    if (e.selectionSet && e.selectionSet.selections.length) {
      r += " " + l.SelectionSet(e.selectionSet);
    }
    return r;
  },
  StringValue(e) {
    if (e.block) {
      return printBlockString(e.value).replace(/\n/g, o);
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
  ObjectValue: e => "{" + mapJoin(e.fields, ", ", l.ObjectField) + "}",
  ObjectField: e => e.name.value + ": " + _print(e.value),
  Document(e) {
    if (!e.definitions || !e.definitions.length) {
      return "";
    } else {
      return mapJoin(e.definitions, "\n\n", _print);
    }
  },
  SelectionSet: e => "{" + (o += "  ") + mapJoin(e.selections, o, _print) + (o = o.slice(0, -2)) + "}",
  Argument: e => e.name.value + ": " + _print(e.value),
  FragmentSpread(e) {
    var r = "..." + e.name.value;
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", l.Directive);
    }
    return r;
  },
  InlineFragment(e) {
    var r = "...";
    if (e.typeCondition) {
      r += " on " + e.typeCondition.name.value;
    }
    if (e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", l.Directive);
    }
    return r += " " + l.SelectionSet(e.selectionSet);
  },
  FragmentDefinition(e) {
    var r = "";
    if (e.description) {
      r += l.StringValue(e.description) + "\n";
    }
    if (r += "fragment " + e.name.value, r += " on " + e.typeCondition.name.value, e.directives && e.directives.length) {
      r += " " + mapJoin(e.directives, " ", l.Directive);
    }
    return r + " " + l.SelectionSet(e.selectionSet);
  },
  Directive(e) {
    var r = "@" + e.name.value;
    if (e.arguments && e.arguments.length) {
      r += "(" + mapJoin(e.arguments, ", ", l.Argument) + ")";
    }
    return r;
  },
  NamedType: e => e.name.value,
  ListType: e => "[" + _print(e.type) + "]",
  NonNullType: e => _print(e.type) + "!"
};

var _print = e => l[e.kind](e);

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

exports.BREAK = a, exports.GraphQLError = GraphQLError, exports.Kind = {
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
}, exports.OperationTypeNode = {
  QUERY: "query",
  MUTATION: "mutation",
  SUBSCRIPTION: "subscription"
}, exports.Source = function Source(e, r, i) {
  return {
    body: e,
    name: r,
    locationOffset: i || {
      line: 1,
      column: 1
    }
  };
}, exports.isSelectionNode = function isSelectionNode(e) {
  return "Field" === e.kind || "FragmentSpread" === e.kind || "InlineFragment" === e.kind;
}, exports.parse = function parse(i, n) {
  if (e = i.body ? i.body : i, r = 0, ignored(), n && n.noLocation) {
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
        end: e.length,
        startToken: void 0,
        endToken: void 0,
        source: {
          body: e,
          name: "graphql.web",
          locationOffset: {
            line: 1,
            column: 1
          }
        }
      }
    };
  }
}, exports.parseType = function parseType(i, n) {
  return e = i.body ? i.body : i, r = 0, type();
}, exports.parseValue = function parseValue(i, n) {
  return e = i.body ? i.body : i, r = 0, ignored(), value(!1);
}, exports.print = function print(e) {
  return o = "\n", l[e.kind] ? l[e.kind](e) : "";
}, exports.printBlockString = printBlockString, exports.printString = printString, 
exports.valueFromASTUntyped = valueFromASTUntyped, exports.valueFromTypeNode = function valueFromTypeNode(e, r, i) {
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
}, exports.visit = function visit(e, r) {
  var i = [];
  var n = [];
  try {
    var t = function traverse(e, t, o) {
      var l = !1;
      var d = r[e.kind] && r[e.kind].enter || r[e.kind] || r.enter;
      var s = d && d.call(r, e, t, o, n, i);
      if (!1 === s) {
        return e;
      } else if (null === s) {
        return null;
      } else if (s === a) {
        throw a;
      } else if (s && "string" == typeof s.kind) {
        l = s !== e, e = s;
      }
      if (o) {
        i.push(o);
      }
      var u;
      var c = {
        ...e
      };
      for (var v in e) {
        n.push(v);
        var f = e[v];
        if (Array.isArray(f)) {
          var p = [];
          for (var m = 0; m < f.length; m++) {
            if (null != f[m] && "string" == typeof f[m].kind) {
              if (i.push(e), n.push(m), u = traverse(f[m], m, f), n.pop(), i.pop(), null == u) {
                l = !0;
              } else {
                l = l || u !== f[m], p.push(u);
              }
            }
          }
          f = p;
        } else if (null != f && "string" == typeof f.kind) {
          if (void 0 !== (u = traverse(f, v, e))) {
            l = l || f !== u, f = u;
          }
        }
        if (n.pop(), l) {
          c[v] = f;
        }
      }
      if (o) {
        i.pop();
      }
      var h = r[e.kind] && r[e.kind].leave || r.leave;
      var g = h && h.call(r, e, t, o, n, i);
      if (g === a) {
        throw a;
      } else if (void 0 !== g) {
        return g;
      } else if (void 0 !== s) {
        return l ? c : s;
      } else {
        return l ? c : e;
      }
    }(e);
    return void 0 !== t && !1 !== t ? t : e;
  } catch (r) {
    if (r !== a) {
      throw r;
    }
    return e;
  }
};
//# sourceMappingURL=graphql.web.js.map
