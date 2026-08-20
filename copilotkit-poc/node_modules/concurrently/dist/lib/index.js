import process from 'node:process';
import { assertNotRuntime } from './assert.js';
import { Command } from './command.js';
import { concurrently as createConcurrently, } from './concurrently.js';
import { InputHandler } from './flow-control/input-handler.js';
import { KillOnSignal } from './flow-control/kill-on-signal.js';
import { KillOthers } from './flow-control/kill-others.js';
import { LogError } from './flow-control/log-error.js';
import { LogExit } from './flow-control/log-exit.js';
import { LogOutput } from './flow-control/log-output.js';
import { LogTimings } from './flow-control/log-timings.js';
import { LoggerPadding } from './flow-control/logger-padding.js';
import { OutputErrorHandler } from './flow-control/output-error-handler.js';
import { RestartProcess } from './flow-control/restart-process.js';
import { Teardown } from './flow-control/teardown.js';
import { Logger } from './logger.js';
import { createSpawn } from './spawn.js';
import { castArray } from './utils.js';
export function concurrently(commands, options = {}) {
    assertNotRuntime(
    // When run via /snap/bin/node, process.execPath maps to the actual snap path, but it also sets
    // several SNAP_* env variables. If the snap is run directly via e.g. /snap/node/current/bin/node,
    // the issues don't happen and no env variables are set.
    !String(process.env.SNAP).startsWith('/snap'), 'Snap', 'Snap confinement can interfere with spawning child processes. See issue #584');
    // To avoid empty strings from hiding the output of commands that don't have a name,
    // keep in the list of commands to hide only strings with some length.
    // This might happen through the CLI when no `--hide` argument is specified, for example.
    const hide = castArray(options.hide).filter((id) => id || id === 0);
    const logger = options.logger ||
        new Logger({
            hide,
            prefixFormat: options.prefix,
            commandLength: options.prefixLength,
            raw: options.raw,
            timestampFormat: options.timestampFormat,
        });
    if (options.prefixColors === false) {
        logger.toggleColors(false);
    }
    const abortController = new AbortController();
    const outputStream = options.outputStream || process.stdout;
    const spawn = createSpawn(options.shell);
    return createConcurrently(commands, {
        maxProcesses: options.maxProcesses,
        raw: options.raw,
        successCondition: options.successCondition,
        cwd: options.cwd,
        spawn,
        hide,
        logger,
        outputStream,
        group: options.group,
        abortSignal: abortController.signal,
        controllers: [
            // LoggerPadding needs to run before any other controllers that might output something
            ...(options.padPrefix ? [new LoggerPadding({ logger })] : []),
            new LogError({ logger }),
            new LogOutput({ logger }),
            new LogExit({ logger }),
            new InputHandler({
                logger,
                defaultInputTarget: options.defaultInputTarget,
                inputStream: options.inputStream || (options.handleInput ? process.stdin : undefined),
                pauseInputStreamOnFinish: options.pauseInputStreamOnFinish,
            }),
            new KillOnSignal({ process, abortController }),
            new RestartProcess({
                logger,
                delay: options.restartDelay,
                tries: options.restartTries,
            }),
            new KillOthers({
                logger,
                conditions: options.killOthersOn || [],
                timeoutMs: options.killTimeout,
                killSignal: options.killSignal,
                abortController,
            }),
            new OutputErrorHandler({ abortController, outputStream }),
            new LogTimings({
                logger: options.timings ? logger : undefined,
                timestampFormat: options.timestampFormat,
            }),
            new Teardown({ logger, spawn, commands: options.teardown || [] }),
        ],
        prefixColors: options.prefixColors || [],
        additionalArguments: options.additionalArguments,
    });
}
// Export all flow controllers, types, and the main concurrently function,
// so that 3rd-parties can use them however they want
// Main
export default concurrently;
export { createConcurrently, Logger };
// Command specific
export { Command };
// Flow controllers
export { InputHandler, KillOnSignal, KillOthers, LogError, LogExit, LogOutput, LogTimings, RestartProcess, };
