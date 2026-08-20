"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportsColorStderr = exports.supportsColor = exports.colors = exports.backgroundColors = exports.foregroundColors = exports.modifiers = exports.colorNames = exports.backgroundColorNames = exports.foregroundColorNames = exports.modifierNames = exports.chalkStderr = exports.Chalk = void 0;
/* eslint-disable */
// @ts-nocheck
const index_js_1 = __importDefault(require("./vendor/ansi-styles/index.cjs"));
const index_js_2 = __importDefault(require("./vendor/supports-color/index.cjs"));
const utilities_js_1 = require("./utilities.cjs");
const { stdout: stdoutColor, stderr: stderrColor } = index_js_2.default;
exports.supportsColor = stdoutColor;
exports.supportsColorStderr = stderrColor;
const GENERATOR = Symbol('GENERATOR');
const STYLER = Symbol('STYLER');
const IS_EMPTY = Symbol('IS_EMPTY');
// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = [
    'ansi',
    'ansi',
    'ansi256',
    'ansi16m',
];
const styles = Object.create(null);
const applyOptions = (object, options = {}) => {
    if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
        throw new Error('The `level` option should be an integer from 0 to 3');
    }
    // Detect level if not set manually
    const colorLevel = stdoutColor ? stdoutColor.level : 0;
    object.level = options.level === undefined ? colorLevel : options.level;
};
class Chalk {
    constructor(options) {
        // eslint-disable-next-line no-constructor-return
        return chalkFactory(options);
    }
}
exports.Chalk = Chalk;
const chalkFactory = options => {
    const chalk = (...strings) => strings.join(' ');
    applyOptions(chalk, options);
    Object.setPrototypeOf(chalk, createChalk.prototype);
    return chalk;
};
function createChalk(options) {
    return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(index_js_1.default)) {
    styles[styleName] = {
        get() {
            const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
            Object.defineProperty(this, styleName, { value: builder });
            return builder;
        },
    };
}
styles.visible = {
    get() {
        const builder = createBuilder(this, this[STYLER], true);
        Object.defineProperty(this, 'visible', { value: builder });
        return builder;
    },
};
const getModelAnsi = (model, level, type, ...arguments_) => {
    if (model === 'rgb') {
        if (level === 'ansi16m') {
            return index_js_1.default[type].ansi16m(...arguments_);
        }
        if (level === 'ansi256') {
            return index_js_1.default[type].ansi256(index_js_1.default.rgbToAnsi256(...arguments_));
        }
        return index_js_1.default[type].ansi(index_js_1.default.rgbToAnsi(...arguments_));
    }
    if (model === 'hex') {
        return getModelAnsi('rgb', level, type, ...index_js_1.default.hexToRgb(...arguments_));
    }
    return index_js_1.default[type][model](...arguments_);
};
const usedModels = ['rgb', 'hex', 'ansi256'];
for (const model of usedModels) {
    styles[model] = {
        get() {
            const { level } = this;
            return function (...arguments_) {
                const styler = createStyler(getModelAnsi(model, levelMapping[level], 'color', ...arguments_), index_js_1.default.color.close, this[STYLER]);
                return createBuilder(this, styler, this[IS_EMPTY]);
            };
        },
    };
    const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
    styles[bgModel] = {
        get() {
            const { level } = this;
            return function (...arguments_) {
                const styler = createStyler(getModelAnsi(model, levelMapping[level], 'bgColor', ...arguments_), index_js_1.default.bgColor.close, this[STYLER]);
                return createBuilder(this, styler, this[IS_EMPTY]);
            };
        },
    };
}
const proto = Object.defineProperties(() => { }, {
    ...styles,
    level: {
        enumerable: true,
        get() {
            return this[GENERATOR].level;
        },
        set(level) {
            this[GENERATOR].level = level;
        },
    },
});
const createStyler = (open, close, parent) => {
    let openAll;
    let closeAll;
    if (parent === undefined) {
        openAll = open;
        closeAll = close;
    }
    else {
        openAll = parent.openAll + open;
        closeAll = close + parent.closeAll;
    }
    return {
        open,
        close,
        openAll,
        closeAll,
        parent,
    };
};
const createBuilder = (self, _styler, _isEmpty) => {
    // Single argument is hot path, implicit coercion is faster than anything
    // eslint-disable-next-line no-implicit-coercion
    const builder = (...arguments_) => applyStyle(builder, (arguments_.length === 1) ? ('' + arguments_[0]) : arguments_.join(' '));
    // We alter the prototype because we must return a function, but there is
    // no way to create a function with a different prototype
    Object.setPrototypeOf(builder, proto);
    builder[GENERATOR] = self;
    builder[STYLER] = _styler;
    builder[IS_EMPTY] = _isEmpty;
    return builder;
};
const applyStyle = (self, string) => {
    if (self.level <= 0 || !string) {
        return self[IS_EMPTY] ? '' : string;
    }
    let styler = self[STYLER];
    if (styler === undefined) {
        return string;
    }
    const { openAll, closeAll } = styler;
    if (string.includes('\u001B')) {
        while (styler !== undefined) {
            // Replace any instances already present with a re-opening code
            // otherwise only the part of the string until said closing code
            // will be colored, and the rest will simply be 'plain'.
            string = (0, utilities_js_1.stringReplaceAll)(string, styler.close, styler.open);
            styler = styler.parent;
        }
    }
    // We can move both next actions out of loop, because remaining actions in loop won't have
    // any/visible effect on parts we add here. Close the styling before a linebreak and reopen
    // after next line to fix a bleed issue on macOS: https://github.com/chalk/chalk/pull/92
    const lfIndex = string.indexOf('\n');
    if (lfIndex !== -1) {
        string = (0, utilities_js_1.stringEncaseCRLFWithFirstIndex)(string, closeAll, openAll, lfIndex);
    }
    return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles);
const chalk = createChalk();
exports.chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var index_js_3 = require("./vendor/ansi-styles/index.cjs");
Object.defineProperty(exports, "modifierNames", { enumerable: true, get: function () { return index_js_3.modifierNames; } });
Object.defineProperty(exports, "foregroundColorNames", { enumerable: true, get: function () { return index_js_3.foregroundColorNames; } });
Object.defineProperty(exports, "backgroundColorNames", { enumerable: true, get: function () { return index_js_3.backgroundColorNames; } });
Object.defineProperty(exports, "colorNames", { enumerable: true, get: function () { return index_js_3.colorNames; } });
// TODO: Remove these aliases in the next major version
Object.defineProperty(exports, "modifiers", { enumerable: true, get: function () { return index_js_3.modifierNames; } });
Object.defineProperty(exports, "foregroundColors", { enumerable: true, get: function () { return index_js_3.foregroundColorNames; } });
Object.defineProperty(exports, "backgroundColors", { enumerable: true, get: function () { return index_js_3.backgroundColorNames; } });
Object.defineProperty(exports, "colors", { enumerable: true, get: function () { return index_js_3.colorNames; } });
exports.default = chalk;
