/**
 * Logs the exit code/signal of commands.
 */
export class LogExit {
    logger;
    constructor({ logger }) {
        this.logger = logger;
    }
    handle(commands) {
        commands.forEach((command) => command.close.subscribe(({ exitCode }) => {
            this.logger.logCommandEvent(`${command.command} exited with code ${exitCode}`, command);
        }));
        return { commands };
    }
}
