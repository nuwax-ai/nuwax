import chalk, { Chalk } from 'chalk';
import Rx from 'rxjs';
import { DateFormatter } from './date-format.js';
import * as defaults from './defaults.js';
import { escapeRegExp, splitOutsideParens } from './utils.js';
const defaultChalk = chalk;
const noColorChalk = new Chalk({ level: 0 });
const HEX_PATTERN = /^#[0-9A-Fa-f]{3,6}$/;
const COLOR_OPEN = '{color}';
const COLOR_CLOSE = '{/color}';
export const COLOR_MARKER_RE = /\{\/?color\}/g;
/**
 * Applies a single color segment to a chalk instance.
 * Handles: function calls (hex, bgHex, rgb, bgRgb, ansi256, bgAnsi256, etc.),
 * shorthands (#HEX, bg#HEX), and named colors/modifiers.
 */
function applySegment(color, segment) {
    // Function call: name(args) - handles chalk color functions
    const fnMatch = segment.match(/^(\w+)\((.+)\)$/);
    if (fnMatch) {
        const [, fnName, argsStr] = fnMatch;
        const args = argsStr.split(',').map((a) => {
            const t = a.trim();
            return /^\d+$/.test(t) ? parseInt(t, 10) : t;
        });
        // Explicit function calls for known chalk color functions
        switch (fnName) {
            case 'rgb':
                return color.rgb(args[0], args[1], args[2]);
            case 'bgRgb':
                return color.bgRgb(args[0], args[1], args[2]);
            case 'hex':
                if (!HEX_PATTERN.test(args[0]))
                    return undefined;
                return color.hex(args[0]);
            case 'bgHex':
                if (!HEX_PATTERN.test(args[0]))
                    return undefined;
                return color.bgHex(args[0]);
            case 'ansi256':
                return color.ansi256(args[0]);
            case 'bgAnsi256':
                return color.bgAnsi256(args[0]);
            default:
                return undefined;
        }
    }
    // Shorthands
    if (segment.startsWith('bg#'))
        return color.bgHex(segment.slice(2));
    if (segment.startsWith('#'))
        return color.hex(segment);
    // Property: black, bold, dim, etc.
    return color[segment] ?? undefined;
}
/**
 * Applies a color string to chalk, supporting chained colors and modifiers.
 * Returns undefined if any segment is invalid (triggers fallback to default).
 */
function applyColor(chalkInstance, colorString) {
    const segments = splitOutsideParens(colorString, '.');
    if (segments.length === 0)
        return undefined;
    let color = chalkInstance;
    for (const segment of segments) {
        const next = applySegment(color, segment);
        if (!next)
            return undefined;
        color = next;
    }
    return color;
}
export class Logger {
    hide;
    raw;
    prefixFormat;
    commandLength;
    dateFormatter;
    chalk = defaultChalk;
    /**
     * How many characters should a prefix have.
     * Prefixes shorter than this will be padded with spaces to the right.
     */
    prefixLength = 0;
    /**
     * Last character emitted, and from which command.
     * If `undefined`, then nothing has been logged yet.
     */
    lastWrite;
    /**
     * Observable that emits when there's been output logged.
     * If `command` is is `undefined`, then the log is for a global event.
     */
    output = new Rx.Subject();
    constructor({ hide, prefixFormat, commandLength, raw = false, timestampFormat, }) {
        this.hide = (hide || []).map(String);
        this.raw = raw;
        this.prefixFormat = prefixFormat;
        this.commandLength = commandLength || defaults.prefixLength;
        this.dateFormatter = new DateFormatter(timestampFormat || defaults.timestampFormat);
    }
    /**
     * Toggles colors on/off globally.
     */
    toggleColors(on) {
        this.chalk = on ? defaultChalk : noColorChalk;
    }
    shortenText(text) {
        if (!text || text.length <= this.commandLength) {
            return text;
        }
        const ellipsis = '..';
        const prefixLength = this.commandLength - ellipsis.length;
        const endLength = Math.floor(prefixLength / 2);
        const beginningLength = prefixLength - endLength;
        const beginning = text.slice(0, beginningLength);
        const end = text.slice(text.length - endLength, text.length);
        return beginning + ellipsis + end;
    }
    getPrefixesFor(command) {
        return {
            // When there's limited concurrency, the PID might not be immediately available,
            // so avoid the string 'undefined' from becoming a prefix
            pid: command.pid != null ? String(command.pid) : '',
            index: String(command.index),
            name: command.name,
            command: this.shortenText(command.command),
            time: this.dateFormatter.format(new Date()),
        };
    }
    getPrefixContent(command) {
        const prefix = this.prefixFormat || (command.name ? 'name' : 'index');
        if (prefix === 'none') {
            return;
        }
        const prefixes = this.getPrefixesFor(command);
        if (Object.keys(prefixes).includes(prefix)) {
            return { type: 'default', value: prefixes[prefix] };
        }
        const value = Object.entries(prefixes).reduce((prev, [key, val]) => {
            const keyRegex = new RegExp(escapeRegExp(`{${key}}`), 'g');
            return prev.replace(keyRegex, String(val));
        }, prefix);
        return { type: 'template', value };
    }
    getPrefix(command) {
        const content = this.getPrefixContent(command);
        if (!content) {
            return '';
        }
        const visibleLength = content.value.replace(COLOR_MARKER_RE, '').length;
        const padding = ' '.repeat(Math.max(0, this.prefixLength - visibleLength));
        return content.type === 'template'
            ? content.value + padding
            : `[${content.value}${padding}]`;
    }
    setPrefixLength(length) {
        this.prefixLength = length;
    }
    colorText(command, text) {
        const prefixColor = command.prefixColor ?? '';
        const defaultColor = applyColor(this.chalk, defaults.prefixColors) ?? this.chalk.reset;
        const color = applyColor(this.chalk, prefixColor) ?? defaultColor;
        // Segment the text around `{color}` / `{/color}` markers and only apply `color`
        // inside opened regions. If either marker is missing, it's implicitly added to
        // the start or end respectively — so a marker-free input stays fully colored,
        // preserving backward compatibility.
        let normalized = text;
        if (!normalized.includes(COLOR_OPEN))
            normalized = COLOR_OPEN + normalized;
        if (!normalized.includes(COLOR_CLOSE))
            normalized = normalized + COLOR_CLOSE;
        let output = '';
        let rest = normalized;
        let inColorRegion = false;
        while (rest.length > 0) {
            const marker = inColorRegion ? COLOR_CLOSE : COLOR_OPEN;
            const idx = rest.indexOf(marker);
            if (idx === -1) {
                // Tail after the last closing marker: normalization guarantees a
                // `{/color}` exists, so once opened a region always finds its close —
                // reaching here implies `inColorRegion` is false and the tail is plain.
                output += rest;
                break;
            }
            const segment = rest.slice(0, idx);
            output += inColorRegion ? color(segment) : segment;
            rest = rest.slice(idx + marker.length);
            inColorRegion = !inColorRegion;
        }
        return output;
    }
    /**
     * Logs an event for a command (e.g. start, stop).
     *
     * If raw mode is on, then nothing is logged.
     */
    logCommandEvent(text, command) {
        if (this.raw) {
            return;
        }
        // Last write was from this command, but it didn't end with a line feed.
        // Prepend one, otherwise the event's text will be concatenated to that write.
        // A line feed is otherwise inserted anyway.
        let prefix = '';
        if (this.lastWrite?.command === command && this.lastWrite.char !== '\n') {
            prefix = '\n';
        }
        this.logCommandText(`${prefix}${this.chalk.reset(text)}\n`, command);
    }
    logCommandText(text, command) {
        if (this.hide.includes(String(command.index)) || this.hide.includes(command.name)) {
            return;
        }
        const prefix = this.colorText(command, this.getPrefix(command));
        return this.log(prefix + (prefix ? ' ' : ''), text, command);
    }
    /**
     * Logs a global event (e.g. sending signals to processes).
     *
     * If raw mode is on, then nothing is logged.
     */
    logGlobalEvent(text) {
        if (this.raw) {
            return;
        }
        this.log(`${this.chalk.reset('-->')} `, `${this.chalk.reset(text)}\n`);
    }
    /**
     * Logs a table from an input object array, like `console.table`.
     *
     * Each row is a single input item, and they are presented in the input order.
     */
    logTable(tableContents) {
        // For now, can only print array tables with some content.
        if (this.raw || !Array.isArray(tableContents) || !tableContents.length) {
            return;
        }
        let nextColIndex = 0;
        const headers = {};
        const contentRows = tableContents.map((row) => {
            const rowContents = [];
            Object.keys(row).forEach((col) => {
                if (!headers[col]) {
                    headers[col] = {
                        index: nextColIndex++,
                        length: col.length,
                    };
                }
                const colIndex = headers[col].index;
                const formattedValue = String(row[col] == null ? '' : row[col]);
                // Update the column length in case this rows value is longer than the previous length for the column.
                headers[col].length = Math.max(formattedValue.length, headers[col].length);
                rowContents[colIndex] = formattedValue;
                return rowContents;
            });
            return rowContents;
        });
        const headersFormatted = Object.keys(headers).map((header) => header.padEnd(headers[header].length, ' '));
        if (!headersFormatted.length) {
            // No columns exist.
            return;
        }
        const borderRowFormatted = headersFormatted.map((header) => '─'.padEnd(header.length, '─'));
        this.logGlobalEvent(`┌─${borderRowFormatted.join('─┬─')}─┐`);
        this.logGlobalEvent(`│ ${headersFormatted.join(' │ ')} │`);
        this.logGlobalEvent(`├─${borderRowFormatted.join('─┼─')}─┤`);
        contentRows.forEach((contentRow) => {
            const contentRowFormatted = headersFormatted.map((header, colIndex) => {
                // If the table was expanded after this row was processed, it won't have this column.
                // Use an empty string in this case.
                const col = contentRow[colIndex] || '';
                return col.padEnd(header.length, ' ');
            });
            this.logGlobalEvent(`│ ${contentRowFormatted.join(' │ ')} │`);
        });
        this.logGlobalEvent(`└─${borderRowFormatted.join('─┴─')}─┘`);
    }
    log(prefix, text, command) {
        if (this.raw) {
            return this.emit(command, text);
        }
        // #70 - replace some ANSI code that would impact clearing lines
        text = text.replace(/\u2026/g, '...');
        // This write's interrupting another command, emit a line feed to start clean.
        if (this.lastWrite && this.lastWrite.command !== command && this.lastWrite.char !== '\n') {
            this.emit(this.lastWrite.command, '\n');
        }
        // Clean lines should emit a prefix
        if (!this.lastWrite || this.lastWrite.char === '\n') {
            this.emit(command, prefix);
        }
        const textToWrite = text.replaceAll('\n', (lf, i) => lf + (text[i + 1] ? prefix : ''));
        this.emit(command, textToWrite);
    }
    emit(command, text) {
        this.lastWrite = { command, char: text[text.length - 1] };
        this.output.next({ command, text });
    }
}
