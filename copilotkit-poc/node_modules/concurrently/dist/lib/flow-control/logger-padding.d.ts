import { Command } from '../command.js';
import { Logger } from '../logger.js';
import { FlowController } from './flow-controller.js';
export declare class LoggerPadding implements FlowController {
    private readonly logger;
    constructor({ logger }: {
        logger: Logger;
    });
    handle(commands: Command[]): {
        commands: Command[];
        onFinish: () => void;
    };
}
