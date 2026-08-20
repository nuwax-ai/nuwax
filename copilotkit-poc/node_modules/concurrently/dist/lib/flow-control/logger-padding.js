import { COLOR_MARKER_RE } from '../logger.js';
function visibleLength(value) {
    return value ? value.replace(COLOR_MARKER_RE, '').length : 0;
}
export class LoggerPadding {
    logger;
    constructor({ logger }) {
        this.logger = logger;
    }
    handle(commands) {
        // Sometimes there's limited concurrency, so not all commands will spawn straight away.
        // Compute the prefix length now, which works for all styles but those with a PID.
        let length = commands.reduce((length, command) => {
            const content = this.logger.getPrefixContent(command);
            return Math.max(length, visibleLength(content?.value));
        }, 0);
        this.logger.setPrefixLength(length);
        // The length of prefixes is somewhat stable, except for PIDs, which might change when a
        // process spawns (e.g. PIDs might look like 1, 10 or 100), therefore listen to command starts
        // and update the prefix length when this happens.
        const subs = commands.map((command) => command.timer.subscribe((event) => {
            if (!event.endDate) {
                const content = this.logger.getPrefixContent(command);
                length = Math.max(length, visibleLength(content?.value));
                this.logger.setPrefixLength(length);
            }
        }));
        return {
            commands,
            onFinish() {
                subs.forEach((sub) => sub.unsubscribe());
            },
        };
    }
}
