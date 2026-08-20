import { Command, SpawnCommand } from '../command.js';
import { Logger } from '../logger.js';
import { FlowController } from './flow-controller.js';
export declare class Teardown implements FlowController {
    private readonly logger;
    private readonly spawn;
    private readonly teardown;
    constructor({ logger, spawn, commands, }: {
        logger: Logger;
        /**
         * Which function to use to spawn commands.
         */
        spawn: SpawnCommand;
        commands: readonly string[];
    });
    handle(commands: Command[]): {
        commands: Command[];
        onFinish: () => Promise<void>;
    };
}
