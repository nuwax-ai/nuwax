"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomEvent = void 0;
exports.CustomEvent = globalThis.CustomEvent ||
    class PonyfillCustomEvent extends Event {
        detail = null;
        constructor(type, eventInitDict) {
            super(type, eventInitDict);
            if (eventInitDict?.detail != null) {
                this.detail = eventInitDict.detail;
            }
        }
        initCustomEvent(type, bubbles, cancelable, detail) {
            this.initEvent(type, bubbles, cancelable);
            if (detail != null) {
                this.detail = detail;
            }
        }
    };
