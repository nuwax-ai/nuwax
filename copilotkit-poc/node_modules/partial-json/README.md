# Partial JSON Parser

Sometimes we need **LLM (Large Language Models)** to produce **structural information** instead of natural language. The easiest way is to use JSON.

But before receiving the last token of response, the JSON is broken, which means you can't use `JSON.parse` to decode it. But we still want to stream the data to the user.

Here comes `partial-json`, a lightweight and customizable library for parsing partial JSON strings. Here is a [demo](https://promplate.dev/partial-json-parser).

(Note that there is [a Python implementation](https://github.com/promplate/partial-json-parser) too)

## Installation

```sh
npm i partial-json # or pnpm / bun / yarn
```

`partial-json` is implemented purely in JavaScript, and have both `commonjs` and `esm` builds.

## Usage

### Importing the library

You can import the `parse` function and the `Allow` object from the library like this:

```js
import { parse, Allow } from "partial-json";
```

The `Allow` object is just an Enum for options. It determines what types can be partial. types not included in `allow` only appears after its completion can be ensured.

### Parsing complete / partial JSON strings

The `parse` function works just like the built-in `JSON.parse` when parsing a complete JSON string:

```js
let result = parse('{"key":"value"}');
console.log(result); // Outputs: { key: 'value' }
```

You can parse a partial JSON string by passing an additional parameter to the `parse` function. This parameter is a **bitwise OR** of the constants from the `Allow` object:

(Note that you can directly import the constants you need from `partial-json`)

```js
import { parse, STR, OBJ } from "partial-json";

result = parse('{"key": "v', STR | OBJ);
console.log(result); // Outputs: { key: 'v' }
```

In this example, `Allow.STR` tells the parser that it's okay if a string is incomplete, and `Allow.OBJ` tells the parser so as an object. The parser then try to return as much data as it can.

If you don't allow partial strings, then it will not add `"key"` to the object because `"v` is not close:

```js
result = parse('{"key": "v', OBJ);
console.log(result); // Outputs: {}

result = parse('{"key": "value"', OBJ);
console.log(result); // Outputs: { key: 'value' }
```

Similarity, you can parse partial arrays or even partial special values if you allow it:

(Note that `allow` defaults to `Allow.ALL`)

```js
result = parse('[ {"key1": "value1", "key2": [ "value2');
console.log(result); // Outputs: [ { key1: 'value1', key2: [ 'value2' ] } ]

result = parse("-Inf");
console.log(result); // Outputs: -Infinity
```

### Handling malformed JSON

If the JSON string is malformed, the `parse` function will throw an error:

```js
parse("wrong"); // MalformedJSON [Error]: SyntaxError: Unexpected token 'w', "wrong" is not valid JSON at position 0
```

## API Reference

### parse(jsonString, [allowPartial])

- `jsonString` `<string>`: The JSON string to parse.
- `allowPartial` `<number>`: Specify what kind of partialness is allowed during JSON parsing (default: `Allow.ALL`).

Returns the parsed JavaScript value.

### Allow

An object that specifies what kind of partialness is allowed during JSON parsing. It has the following properties:

- `STR`: Allow partial string.
- `NUM`: Allow partial number.
- `ARR`: Allow partial array.
- `OBJ`: Allow partial object.
- `NULL`: Allow partial null.
- `BOOL`: Allow partial boolean.
- `NAN`: Allow partial NaN.
- `INFINITY`: Allow partial Infinity.
- `_INFINITY`: Allow partial -Infinity.
- `INF`: Allow both partial Infinity and -Infinity.
- `SPECIAL`: Allow all special values.
- `ATOM`: Allow all atomic values.
- `COLLECTION`: Allow all collection values.
- `ALL`: Allow all values.

## Testing

To run the tests for this library, you should clone the repository and install the dependencies:

```sh
git clone https://github.com/promplate/partial-json-parser-js.git
cd partial-json-parser-js
npm i
```

Then, you can run the tests using [Vitest](https://vitest.dev/):

```sh
npm run test
```

Please note that while we strive to cover as many edge cases as possible, it's always possible that some cases might not be covered.

## License

This project is licensed under the MIT License.
