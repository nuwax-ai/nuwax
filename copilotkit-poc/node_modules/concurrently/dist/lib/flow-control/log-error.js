/**
 * Logs when commands failed executing, e.g. due to the executable not existing in the system.
 */
export class LogError {
    logger;
    constructor({ logger }) {
        this.logger = logger;
    }
    handle(commands) {
        commands.forEach((command) => command.error.subscribe((event) => {
            this.logger.logCommandEvent(`Error occurred when executing command: ${command.command}`, command);
            const errorText = String(event instanceof Error ? event.stack || event : event);
            this.logger.logCommandEvent(errorText, command);
        }));
        return { commands };
    }
}
