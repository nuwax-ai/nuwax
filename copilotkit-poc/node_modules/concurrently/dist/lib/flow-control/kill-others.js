import { filter, map } from 'rxjs/operators';
import { Command } from '../command.js';
import { castArray } from '../utils.js';
/**
 * Sends a SIGTERM signal to all commands when one of the commands exits with a matching condition.
 */
export class KillOthers {
    logger;
    abortController;
    conditions;
    killSignal;
    timeoutMs;
    constructor({ logger, abortController, conditions, killSignal, timeoutMs, }) {
        this.logger = logger;
        this.abortController = abortController;
        this.conditions = castArray(conditions);
        this.killSignal = killSignal;
        this.timeoutMs = timeoutMs;
    }
    handle(commands) {
        const conditions = this.conditions.filter((condition) => condition === 'failure' || condition === 'success');
        if (!conditions.length) {
            return { commands };
        }
        const closeStates = commands.map((command) => command.close.pipe(map(({ exitCode }) => exitCode === 0 ? 'success' : 'failure'), filter((state) => conditions.includes(state))));
        closeStates.forEach((closeState) => closeState.subscribe(() => {
            this.abortController?.abort();
            const killableCommands = commands.filter((command) => Command.canKill(command));
            if (killableCommands.length) {
                this.logger.logGlobalEvent(`Sending ${this.killSignal || 'SIGTERM'} to other processes..`);
                killableCommands.forEach((command) => command.kill(this.killSignal));
                this.maybeForceKill(killableCommands);
            }
        }));
        return { commands };
    }
    maybeForceKill(commands) {
        // No need to force kill when the signal already is SIGKILL.
        if (!this.timeoutMs || this.killSignal === 'SIGKILL') {
            return;
        }
        setTimeout(() => {
            const killableCommands = commands.filter((command) => Command.canKill(command));
            if (killableCommands) {
                this.logger.logGlobalEvent(`Sending SIGKILL to ${killableCommands.length} processes..`);
                killableCommands.forEach((command) => command.kill('SIGKILL'));
            }
        }, this.timeoutMs);
    }
}
