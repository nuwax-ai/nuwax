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
import { EventEmitter } from '../common/events.js';
/**
 * Represents the state model for an individual UI component.
 */
export class ComponentModel {
    /**
     * Creates a new component model.
     *
     * @param id The unique identifier for this component.
     * @param type The component type name.
     * @param initialProperties The initial properties for the component.
     */
    constructor(id, type, initialProperties) {
        this.id = id;
        this.type = type;
        this._onUpdated = new EventEmitter();
        /**
         * Fires whenever the component's properties are updated.
         */
        this.onUpdated = this._onUpdated;
        this._properties = initialProperties;
    }
    /**
     * The current properties of the component.
     */
    get properties() {
        return this._properties;
    }
    set properties(newProperties) {
        this._properties = newProperties;
        this._onUpdated.emit(this);
    }
    /**
     * Disposes of the component and its resources.
     */
    dispose() {
        this._onUpdated.dispose();
    }
    /**
     * Returns a JSON representation of the component tree.
     */
    get componentTree() {
        return {
            id: this.id,
            type: this.type,
            ...this._properties,
        };
    }
}
//# sourceMappingURL=component-model.js.map