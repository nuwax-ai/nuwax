import assert from 'node:assert';
import Rx from 'rxjs';
import { bufferCount, combineLatestWith, take } from 'rxjs/operators';
import { DateFormatter } from '../date-format.js';
import * as defaults from '../defaults.js';
/**
 * Logs timing information about commands as they start/stop and then a summary when all commands finish.
 */
export class LogTimings {
    static mapCloseEventToTimingInfo({ command, timings, killed, exitCode, }) {
        const readableDurationMs = (timings.endDate.getTime() - timings.startDate.getTime()).toLocaleString();
        return {
            name: command.name,
            duration: readableDurationMs,
            'exit code': exitCode,
            killed,
            command: command.command,
        };
    }
    logger;
    dateFormatter;
    constructor({ logger, timestampFormat = defaults.timestampFormat, }) {
        this.logger = logger;
        this.dateFormatter = new DateFormatter(timestampFormat);
    }
    printExitInfoTimingTable(exitInfos) {
        assert.ok(this.logger);
        const exitInfoTable = exitInfos
            .sort((a, b) => b.timings.durationSeconds - a.timings.durationSeconds)
            .map(LogTimings.mapCloseEventToTimingInfo);
        this.logger.logGlobalEvent('Timings:');
        this.logger.logTable(exitInfoTable);
        return exitInfos;
    }
    handle(commands) {
        const { logger } = this;
        if (!logger) {
            return { commands };
        }
        // individual process timings
        commands.forEach((command) => {
            command.timer.subscribe(({ startDate, endDate }) => {
                if (!endDate) {
                    const formattedStartDate = this.dateFormatter.format(startDate);
                    logger.logCommandEvent(`${command.command} started at ${formattedStartDate}`, command);
                }
                else {
                    const durationMs = endDate.getTime() - startDate.getTime();
                    const formattedEndDate = this.dateFormatter.format(endDate);
                    logger.logCommandEvent(`${command.command} stopped at ${formattedEndDate} after ${durationMs.toLocaleString()}ms`, command);
                }
            });
        });
        // overall summary timings
        const closeStreams = commands.map((command) => command.close);
        const finished = new Rx.Subject();
        const allProcessesClosed = Rx.merge(...closeStreams).pipe(bufferCount(closeStreams.length), take(1), combineLatestWith(finished));
        allProcessesClosed.subscribe(([exitInfos]) => this.printExitInfoTimingTable(exitInfos));
        return { commands, onFinish: () => finished.next() };
    }
}
