/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Internal implementation used by the model.
 * Implements EventSource but also provides the 'emit' method.
 */
export class EventEmitter {
    constructor() {
        this.listeners = new Set();
    }
    /**
     * Subscribes to the event.
     *
     * @param listener The listener function to call when the event is emitted.
     * @returns A subscription object that can be used to unsubscribe.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return {
            unsubscribe: () => this.listeners.delete(listener),
        };
    }
    /**
     * Emits an event to all subscribers.
     *
     * @param data The data to pass to subscribers.
     */
    async emit(data) {
        for (const listener of this.listeners) {
            try {
                await listener(data);
            }
            catch (e) {
                console.error('EventEmitter error:', e);
            }
        }
    }
    /**
     * Removes all listeners.
     */
    dispose() {
        this.listeners.clear();
    }
}
//# sourceMappingURL=events.js.map