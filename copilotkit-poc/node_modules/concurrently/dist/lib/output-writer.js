import Rx from 'rxjs';
import { fromSharedEvent } from './observables.js';
/**
 * Class responsible for actually writing output onto a writable stream.
 */
export class OutputWriter {
    outputStream;
    group;
    buffers;
    activeCommandIndex = 0;
    error;
    get errored() {
        return this.outputStream.errored;
    }
    constructor({ outputStream, group, commands, }) {
        this.outputStream = outputStream;
        this.ensureWritable();
        this.error = fromSharedEvent(this.outputStream, 'error');
        this.group = group;
        this.buffers = commands.map(() => []);
        if (this.group) {
            Rx.merge(...commands.map((c) => c.close)).subscribe((command) => {
                if (command.index !== this.activeCommandIndex) {
                    return;
                }
                for (let i = command.index + 1; i < commands.length; i++) {
                    this.activeCommandIndex = i;
                    this.flushBuffer(i);
                    // TODO: Should errored commands also flush buffer?
                    if (commands[i].state !== 'exited') {
                        break;
                    }
                }
            });
        }
    }
    ensureWritable() {
        if (this.errored) {
            throw new TypeError('outputStream is in errored state', { cause: this.errored });
        }
    }
    write(command, text) {
        this.ensureWritable();
        if (this.group && command) {
            if (command.index <= this.activeCommandIndex) {
                this.outputStream.write(text);
            }
            else {
                this.buffers[command.index].push(text);
            }
        }
        else {
            // "global" logs (command=null) are output out of order
            this.outputStream.write(text);
        }
    }
    flushBuffer(index) {
        if (!this.errored) {
            this.buffers[index].forEach((t) => this.outputStream.write(t));
        }
        this.buffers[index] = [];
    }
}
