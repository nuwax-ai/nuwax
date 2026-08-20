import Rx from 'rxjs';
import { getSpawnOpts } from '../spawn.js';
export class Teardown {
    logger;
    spawn;
    teardown;
    constructor({ logger, spawn, commands, }) {
        this.logger = logger;
        this.spawn = spawn;
        this.teardown = commands;
    }
    handle(commands) {
        const { logger, teardown, spawn } = this;
        const onFinish = async () => {
            if (!teardown.length) {
                return;
            }
            for (const command of teardown) {
                logger.logGlobalEvent(`Running teardown command "${command}"`);
                const child = spawn(command, getSpawnOpts({ stdio: 'raw' }));
                const error = Rx.fromEvent(child, 'error');
                const close = Rx.fromEvent(child, 'close');
                try {
                    const [exitCode, signal] = await Promise.race([
                        Rx.firstValueFrom(error).then((event) => {
                            throw event;
                        }),
                        Rx.firstValueFrom(close).then((event) => event),
                    ]);
                    logger.logGlobalEvent(`Teardown command "${command}" exited with code ${exitCode ?? signal}`);
                    if (signal === 'SIGINT') {
                        break;
                    }
                }
                catch (error) {
                    const errorText = String(error instanceof Error ? error.stack || error : error);
                    logger.logGlobalEvent(`Teardown command "${command}" errored:`);
                    logger.logGlobalEvent(errorText);
                    return Promise.reject(error);
                }
            }
        };
        return { commands, onFinish };
    }
}
