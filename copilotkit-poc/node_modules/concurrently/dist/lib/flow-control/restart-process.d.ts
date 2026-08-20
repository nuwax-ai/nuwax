import Rx from 'rxjs';
import { Command } from '../command.js';
import { Logger } from '../logger.js';
import { FlowController } from './flow-controller.js';
export type RestartDelay = number | 'exponential';
/**
 * Restarts commands that fail up to a defined number of times.
 */
export declare class RestartProcess implements FlowController {
    private readonly logger;
    private readonly scheduler?;
    private readonly delay;
    readonly tries: number;
    constructor({ delay, tries, logger, scheduler, }: {
        delay?: RestartDelay;
        tries?: number;
        logger: Logger;
        scheduler?: Rx.SchedulerLike;
    });
    handle(commands: Command[]): {
        commands: Command[];
    };
}
