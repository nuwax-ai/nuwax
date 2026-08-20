/**
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
 * Event dispatched when an input component's validation state is updated.
 */
export class A2UIValidationEvent extends CustomEvent {
    static { this.EVENT_NAME = "a2ui-validation-input"; }
    constructor(detail, eventInitDict) {
        super(A2UIValidationEvent.EVENT_NAME, {
            bubbles: true,
            composed: true,
            ...eventInitDict,
            detail: {
                ...detail,
                eventType: A2UIValidationEvent.EVENT_NAME,
            },
        });
    }
}
//# sourceMappingURL=validation-event.js.map