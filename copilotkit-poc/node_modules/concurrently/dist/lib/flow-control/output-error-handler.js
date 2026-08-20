import { fromSharedEvent } from '../observables.js';
/**
 * Kills processes and aborts further command spawning on output stream error (namely, SIGPIPE).
 */
export class OutputErrorHandler {
    outputStream;
    abortController;
    constructor({ abortController, outputStream, }) {
        this.abortController = abortController;
        this.outputStream = outputStream;
    }
    handle(commands) {
        const subscription = fromSharedEvent(this.outputStream, 'error').subscribe(() => {
            commands.forEach((command) => command.kill());
            // Avoid further commands from spawning, e.g. if `RestartProcess` is used.
            this.abortController.abort();
        });
        return {
            commands,
            onFinish: () => subscription.unsubscribe(),
        };
    }
}
