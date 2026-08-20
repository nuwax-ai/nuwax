import { Command } from '../command.js';
import { Logger } from '../logger.js';
import { FlowController } from './flow-controller.js';
export type ProcessCloseCondition = 'failure' | 'success';
/**
 * Sends a SIGTERM signal to all commands when one of the commands exits with a matching condition.
 */
export declare class KillOthers implements FlowController {
    private readonly logger;
    private readonly abortController?;
    private readonly conditions;
    private readonly killSignal;
    private readonly timeoutMs?;
    constructor({ logger, abortController, conditions, killSignal, timeoutMs, }: {
        logger: Logger;
        abortController?: AbortController;
        conditions: ProcessCloseCondition | ProcessCloseCondition[];
        killSignal: string | undefined;
        timeoutMs?: number;
    });
    handle(commands: Command[]): {
        commands: Command[];
    };
    private maybeForceKill;
}
