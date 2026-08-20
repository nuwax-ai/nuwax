"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Allow = exports.MalformedJSON = exports.PartialJSON = exports.parseJSON = exports.parse = void 0;
const options_1 = require("./options");
Object.defineProperty(exports, "Allow", { enumerable: true, get: function () { return options_1.Allow; } });
__exportStar(require("./options"), exports);
class PartialJSON extends Error {
}
exports.PartialJSON = PartialJSON;
class MalformedJSON extends Error {
}
exports.MalformedJSON = MalformedJSON;
/**
 * Parse incomplete JSON
 * @param {string} jsonString Partial JSON to be parsed
 * @param {number} allowPartial Specify what types are allowed to be partial, see {@link Allow} for details
 * @returns The parsed JSON
 * @throws {PartialJSON} If the JSON is incomplete (related to the `allow` parameter)
 * @throws {MalformedJSON} If the JSON is malformed
 */
function parseJSON(jsonString, allowPartial = options_1.Allow.ALL) {
    if (typeof jsonString !== "string") {
        throw new TypeError(`expecting str, got ${typeof jsonString}`);
    }
    if (!jsonString.trim()) {
        throw new Error(`${jsonString} is empty`);
    }
    return _parseJSON(jsonString.trim(), allowPartial);
}
exports.parseJSON = parseJSON;
;
const _parseJSON = (jsonString, allow) => {
    const length = jsonString.length;
    let index = 0;
    const markPartialJSON = (msg) => {
        throw new PartialJSON(`${msg} at position ${index}`);
    };
    const throwMalformedError = (msg) => {
        throw new MalformedJSON(`${msg} at position ${index}`);
    };
    const parseAny = () => {
        skipBlank();
        if (index >= length)
            markPartialJSON("Unexpected end of input");
        if (jsonString[index] === '"')
            return parseStr();
        if (jsonString[index] === "{")
            return parseObj();
        if (jsonString[index] === "[")
            return parseArr();
        if (jsonString.substring(index, index + 4) === "null" || (options_1.Allow.NULL & allow && length - index < 4 && "null".startsWith(jsonString.substring(index)))) {
            index += 4;
            return null;
        }
        if (jsonString.substring(index, index + 4) === "true" || (options_1.Allow.BOOL & allow && length - index < 4 && "true".startsWith(jsonString.substring(index)))) {
            index += 4;
            return true;
        }
        if (jsonString.substring(index, index + 5) === "false" || (options_1.Allow.BOOL & allow && length - index < 5 && "false".startsWith(jsonString.substring(index)))) {
            index += 5;
            return false;
        }
        if (jsonString.substring(index, index + 8) === "Infinity" || (options_1.Allow.INFINITY & allow && length - index < 8 && "Infinity".startsWith(jsonString.substring(index)))) {
            index += 8;
            return Infinity;
        }
        if (jsonString.substring(index, index + 9) === "-Infinity" || (options_1.Allow._INFINITY & allow && 1 < length - index && length - index < 9 && "-Infinity".startsWith(jsonString.substring(index)))) {
            index += 9;
            return -Infinity;
        }
        if (jsonString.substring(index, index + 3) === "NaN" || (options_1.Allow.NAN & allow && length - index < 3 && "NaN".startsWith(jsonString.substring(index)))) {
            index += 3;
            return NaN;
        }
        return parseNum();
    };
    const parseStr = () => {
        const start = index;
        let escape = false;
        index++; // skip initial quote
        while (index < length && (jsonString[index] !== '"' || (escape && jsonString[index - 1] === "\\"))) {
            escape = jsonString[index] === "\\" ? !escape : false;
            index++;
        }
        if (jsonString.charAt(index) == '"') {
            try {
                return JSON.parse(jsonString.substring(start, ++index - Number(escape)));
            }
            catch (e) {
                throwMalformedError(String(e));
            }
        }
        else if (options_1.Allow.STR & allow) {
            try {
                return JSON.parse(jsonString.substring(start, index - Number(escape)) + '"');
            }
            catch (e) {
                // SyntaxError: Invalid escape sequence
                return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("\\")) + '"');
            }
        }
        markPartialJSON("Unterminated string literal");
    };
    const parseObj = () => {
        index++; // skip initial brace
        skipBlank();
        const obj = {};
        try {
            while (jsonString[index] !== "}") {
                skipBlank();
                if (index >= length && options_1.Allow.OBJ & allow)
                    return obj;
                const key = parseStr();
                skipBlank();
                index++; // skip colon
                try {
                    const value = parseAny();
                    obj[key] = value;
                }
                catch (e) {
                    if (options_1.Allow.OBJ & allow)
                        return obj;
                    else
                        throw e;
                }
                skipBlank();
                if (jsonString[index] === ",")
                    index++; // skip comma
            }
        }
        catch (e) {
            if (options_1.Allow.OBJ & allow)
                return obj;
            else
                markPartialJSON("Expected '}' at end of object");
        }
        index++; // skip final brace
        return obj;
    };
    const parseArr = () => {
        index++; // skip initial bracket
        const arr = [];
        try {
            while (jsonString[index] !== "]") {
                arr.push(parseAny());
                skipBlank();
                if (jsonString[index] === ",") {
                    index++; // skip comma
                }
            }
        }
        catch (e) {
            if (options_1.Allow.ARR & allow) {
                return arr;
            }
            markPartialJSON("Expected ']' at end of array");
        }
        index++; // skip final bracket
        return arr;
    };
    const parseNum = () => {
        if (index === 0) {
            if (jsonString === "-")
                throwMalformedError("Not sure what '-' is");
            try {
                return JSON.parse(jsonString);
            }
            catch (e) {
                if (options_1.Allow.NUM & allow)
                    try {
                        return JSON.parse(jsonString.substring(0, jsonString.lastIndexOf("e")));
                    }
                    catch (e) { }
                throwMalformedError(String(e));
            }
        }
        const start = index;
        if (jsonString[index] === "-")
            index++;
        while (jsonString[index] && ",]}".indexOf(jsonString[index]) === -1)
            index++;
        if (index == length && !(options_1.Allow.NUM & allow))
            markPartialJSON("Unterminated number literal");
        try {
            return JSON.parse(jsonString.substring(start, index));
        }
        catch (e) {
            if (jsonString.substring(start, index) === "-")
                markPartialJSON("Not sure what '-' is");
            try {
                return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("e")));
            }
            catch (e) {
                throwMalformedError(String(e));
            }
        }
    };
    const skipBlank = () => {
        while (index < length && " \n\r\t".includes(jsonString[index])) {
            index++;
        }
    };
    return parseAny();
};
const parse = parseJSON;
exports.parse = parse;
