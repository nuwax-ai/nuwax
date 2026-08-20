# untruncate-json

Fix up the end of a partial JSON string to create valid JSON.

[![Build Status](https://travis-ci.com/dphilipson/untruncate-json.svg?branch=master)](https://travis-ci.com/dphilipson/untruncate-json)

## Motivation

Have you ever been given a string that started off as valid JSON, but was then
truncated to fit under some maximum length? And even though it was invalid JSON
because it was cut off in the middle, you still wanted to parse it as JSON
anyways so you could extract what information you could from it?

No?

Well if you ever do, then this is the library for you!

## Installation

With NPM:

```
npm install untruncate-json
```

With Yarn:

```
yarn add untruncate-json
```

## Usage

Import the `untruncateJson` function:

```ts
import untruncateJson from "untruncate-json";
```

Call it on a truncated JSON string to get a complete, valid JSON string:

```ts
untruncateJson("[1, 2"); // -> "[1, 2]"
untruncateJson('"Hello, Wor'); // -> '"Hello, Wor"'
untruncateJson('{"votes": [true, fa'); // -> '{"votes": [true, false]}'
untruncateJson("123."); // -> "123.0"
```

`untruncateJson` will sometimes remove characters as well, if there was no way
to infer what value they were starting:

```ts
untruncateJson("[1, 2, "); // -> "[1, 2]"
untruncateJson('"abc\\'); // -> '"abc"'
untruncateJson('{"x": 20, "y": '); // -> '{"x": 20}'
```

Check the [test
cases](https://github.com/dphilipson/untruncate-json/blob/master/test/index.test.ts)
for many more examples.

## Guarantees

- As long as the input is the prefix of a valid JSON string and is not entirely
  whitespace, the output will be valid JSON.
- This takes into account all parts of the JSON spec, including rules around
  exponents in numbers, Unicode escape sequences in strings, and so forth.
- **`untruncateJson` does not attempt to validate the input JSON.** Therefore if
  the input JSON is not the prefix of valid JSON, then the output will not be
  valid JSON and will fail if you try to parse it.
- The output will always contain as many correct values as can be determined
  under the assumption that the input was indeed the prefix of valid JSON. For
  example, if the input is cut off after a bare `t`, then `truncateJson` will
  assume that it was the start of the token `true`.
- The last value appearing in the output JSON may have an incorrect value, for
  example if it is a truncated number or string. However, it will never have the
  incorrect _type_, e.g. if the input contained a string in that position, so
  will the output.
- In cases where the type of the last value cannot be inferred, then characters
  are removed from the end of the input as needed to avoid making a potentially
  incorrect guess. For example, if the truncation occurs after an object key but
  before any part of its corresponding value, then the entire key will be
  removed.

Copyright © 2019 David Philipson
