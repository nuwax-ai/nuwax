import { fromEvent, share } from 'rxjs';
const sharedEvents = new WeakMap();
/**
 * Creates an observable for a specific event of an `EventEmitter` instance.
 *
 * The underlying event listener is set up only once across the application for that event emitter/name pair.
 */
export function fromSharedEvent(emitter, event) {
    let emitterEvents = sharedEvents.get(emitter);
    if (!emitterEvents) {
        emitterEvents = new Map();
        sharedEvents.set(emitter, emitterEvents);
    }
    let observable = emitterEvents.get(event);
    if (!observable) {
        observable = fromEvent(emitter, event).pipe(share());
        emitterEvents.set(event, observable);
    }
    return observable;
}
