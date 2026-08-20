import { Writable } from 'node:stream';
import { Command } from '../command.js';
import { FlowController } from './flow-controller.js';
/**
 * Kills processes and aborts further command spawning on output stream error (namely, SIGPIPE).
 */
export declare class OutputErrorHandler implements FlowController {
    private readonly outputStream;
    private readonly abortController;
    constructor({ abortController, outputStream, }: {
        abortController: AbortController;
        outputStream: Writable;
    });
    handle(commands: Command[]): {
        commands: Command[];
        onFinish: () => void;
    };
}
