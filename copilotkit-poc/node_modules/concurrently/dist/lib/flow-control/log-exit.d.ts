import { Command } from '../command.js';
import { Logger } from '../logger.js';
import { FlowController } from './flow-controller.js';
/**
 * Logs the exit code/signal of commands.
 */
export declare class LogExit implements FlowController {
    private readonly logger;
    constructor({ logger }: {
        logger: Logger;
    });
    handle(commands: Command[]): {
        commands: Command[];
    };
}
