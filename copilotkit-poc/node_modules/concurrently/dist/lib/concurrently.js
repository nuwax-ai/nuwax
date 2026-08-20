import assert from 'node:assert';
import os from 'node:os';
import { takeUntil } from 'rxjs';
import treeKill from 'tree-kill';
import { Command, } from './command.js';
import { ExpandArguments } from './command-parser/expand-arguments.js';
import { ExpandShortcut } from './command-parser/expand-shortcut.js';
import { ExpandWildcard } from './command-parser/expand-wildcard.js';
import { CompletionListener } from './completion-listener.js';
import { OutputWriter } from './output-writer.js';
import { PrefixColorSelector } from './prefix-color-selector.js';
import { createSpawn, getSpawnOpts } from './spawn.js';
import { castArray } from './utils.js';
const defaults = {
    spawn: createSpawn(),
    kill: treeKill,
    raw: false,
    controllers: [],
    cwd: undefined,
};
/**
 * Core concurrently functionality -- spawns the given commands concurrently and
 * returns the commands themselves + the result according to the specified success condition.
 *
 * @see CompletionListener
 */
export function concurrently(baseCommands, baseOptions) {
    assert.ok(Array.isArray(baseCommands), '[concurrently] commands should be an array');
    assert.notStrictEqual(baseCommands.length, 0, '[concurrently] no commands provided');
    const options = { ...defaults, ...baseOptions };
    const prefixColorSelector = new PrefixColorSelector(options.prefixColors || []);
    const commandParsers = [new ExpandShortcut(), new ExpandWildcard()];
    if (options.additionalArguments) {
        commandParsers.push(new ExpandArguments(options.additionalArguments));
    }
    const hide = (options.hide || []).map(String);
    let commands = baseCommands
        .map(mapToCommandInfo)
        .flatMap((command) => parseCommand(command, commandParsers))
        .map((command, index) => {
        const hidden = hide.includes(command.name) || hide.includes(String(index));
        return new Command({
            index,
            prefixColor: prefixColorSelector.getNextColor(),
            ...command,
        }, getSpawnOpts({
            ipc: command.ipc,
            stdio: hidden ? 'hidden' : (command.raw ?? options.raw) ? 'raw' : 'normal',
            env: command.env,
            cwd: command.cwd || options.cwd,
        }), options.spawn, options.kill);
    });
    const handleResult = options.controllers.reduce(({ commands: prevCommands, onFinishCallbacks }, controller) => {
        const { commands, onFinish } = controller.handle(prevCommands);
        return {
            commands,
            onFinishCallbacks: onFinishCallbacks.concat(onFinish ? [onFinish] : []),
        };
    }, { commands, onFinishCallbacks: [] });
    commands = handleResult.commands;
    if (options.logger && options.outputStream) {
        const outputWriter = new OutputWriter({
            outputStream: options.outputStream,
            group: !!options.group,
            commands,
        });
        options.logger.output
            // Stop trying to write after there's been an error.
            .pipe(takeUntil(outputWriter.error))
            .subscribe(({ command, text }) => outputWriter.write(command, text));
    }
    const commandsLeft = commands.slice();
    const maxProcesses = Math.max(1, (typeof options.maxProcesses === 'string' && options.maxProcesses.endsWith('%')
        ? Math.round((os.cpus().length * Number(options.maxProcesses.slice(0, -1))) / 100)
        : Number(options.maxProcesses)) || commandsLeft.length);
    for (let i = 0; i < maxProcesses; i++) {
        maybeRunMore(commandsLeft, options.abortSignal);
    }
    const result = new CompletionListener({ successCondition: options.successCondition })
        .listen(commands, options.abortSignal)
        .finally(() => Promise.all(handleResult.onFinishCallbacks.map((onFinish) => onFinish())));
    return {
        result,
        commands,
    };
}
function mapToCommandInfo(command) {
    if (typeof command === 'string') {
        return mapToCommandInfo({ command });
    }
    assert.ok(command.command, '[concurrently] command cannot be empty');
    return {
        command: command.command,
        name: command.name || '',
        env: command.env || {},
        cwd: command.cwd || '',
        ipc: command.ipc,
        ...(command.prefixColor
            ? {
                prefixColor: command.prefixColor,
            }
            : {}),
        ...(command.raw !== undefined
            ? {
                raw: command.raw,
            }
            : {}),
    };
}
function parseCommand(command, parsers) {
    return parsers.reduce((commands, parser) => commands.flatMap((command) => parser.parse(command)), castArray(command));
}
function maybeRunMore(commandsLeft, abortSignal) {
    const command = commandsLeft.shift();
    if (!command || abortSignal?.aborted) {
        return;
    }
    command.start();
    command.close.subscribe(() => {
        maybeRunMore(commandsLeft, abortSignal);
    });
}
