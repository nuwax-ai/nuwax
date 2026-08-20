import { Command } from '../command.js';
import { Logger } from '../logger.js';
import { FlowController } from './flow-controller.js';
/**
 * Logs when commands failed executing, e.g. due to the executable not existing in the system.
 */
export declare class LogError implements FlowController {
    private readonly logger;
    constructor({ logger }: {
        logger: Logger;
    });
    handle(commands: Command[]): {
        commands: Command[];
    };
}
