import { Command } from '../command.js';
import { Logger } from '../logger.js';
import { FlowController } from './flow-controller.js';
/**
 * Logs the stdout and stderr output of commands.
 */
export declare class LogOutput implements FlowController {
    private readonly logger;
    constructor({ logger }: {
        logger: Logger;
    });
    handle(commands: Command[]): {
        commands: Command[];
    };
}
