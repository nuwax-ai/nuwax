import {useMemo as $cOe4a$useMemo, useCallback as $cOe4a$useCallback} from "react";
import {useSyncExternalStore as $cOe4a$useSyncExternalStore} from "use-sync-external-store/shim/index.js";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $4175972a06e8c575$export$c7b26b20d3ced9c5(props = {}) {
    let { maxVisibleToasts: maxVisibleToasts = 1, wrapUpdate: wrapUpdate } = props;
    let queue = (0, $cOe4a$useMemo)(()=>new $4175972a06e8c575$export$f1f8569633bbbec4({
            maxVisibleToasts: maxVisibleToasts,
            wrapUpdate: wrapUpdate
        }), [
        maxVisibleToasts,
        wrapUpdate
    ]);
    return $4175972a06e8c575$export$84726ef35ca2129a(queue);
}
function $4175972a06e8c575$export$84726ef35ca2129a(queue) {
    let subscribe = (0, $cOe4a$useCallback)((fn)=>queue.subscribe(fn), [
        queue
    ]);
    let getSnapshot = (0, $cOe4a$useCallback)(()=>queue.visibleToasts, [
        queue
    ]);
    let visibleToasts = (0, $cOe4a$useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
    return {
        visibleToasts: visibleToasts,
        add: (content, options)=>queue.add(content, options),
        close: (key)=>queue.close(key),
        pauseAll: ()=>queue.pauseAll(),
        resumeAll: ()=>queue.resumeAll()
    };
}
class $4175972a06e8c575$export$f1f8569633bbbec4 {
    runWithWrapUpdate(fn, action) {
        if (this.wrapUpdate) this.wrapUpdate(fn, action);
        else fn();
    }
    /** Subscribes to updates to the visible toasts. */ subscribe(fn) {
        this.subscriptions.add(fn);
        return ()=>this.subscriptions.delete(fn);
    }
    /** Adds a new toast to the queue. */ add(content, options = {}) {
        let toastKey = '_' + Math.random().toString(36).slice(2);
        let toast = {
            ...options,
            content: content,
            key: toastKey,
            timer: options.timeout ? new $4175972a06e8c575$var$Timer(()=>this.close(toastKey), options.timeout) : undefined
        };
        this.queue.unshift(toast);
        this.updateVisibleToasts('add');
        return toastKey;
    }
    /**
   * Closes a toast.
   */ close(key) {
        let index = this.queue.findIndex((t)=>t.key === key);
        if (index >= 0) {
            var _this_queue_index_onClose, _this_queue_index;
            (_this_queue_index_onClose = (_this_queue_index = this.queue[index]).onClose) === null || _this_queue_index_onClose === void 0 ? void 0 : _this_queue_index_onClose.call(_this_queue_index);
            this.queue.splice(index, 1);
        }
        this.updateVisibleToasts('remove');
    }
    updateVisibleToasts(action) {
        this.visibleToasts = this.queue.slice(0, this.maxVisibleToasts);
        this.runWithWrapUpdate(()=>{
            for (let fn of this.subscriptions)fn();
        }, action);
    }
    /** Pauses the timers for all visible toasts. */ pauseAll() {
        for (let toast of this.visibleToasts)if (toast.timer) toast.timer.pause();
    }
    /** Resumes the timers for all visible toasts. */ resumeAll() {
        for (let toast of this.visibleToasts)if (toast.timer) toast.timer.resume();
    }
    clear() {
        this.queue = [];
        this.updateVisibleToasts('clear');
    }
    constructor(options){
        this.queue = [];
        this.subscriptions = new Set();
        /** The currently visible toasts. */ this.visibleToasts = [];
        var _options_maxVisibleToasts;
        this.maxVisibleToasts = (_options_maxVisibleToasts = options === null || options === void 0 ? void 0 : options.maxVisibleToasts) !== null && _options_maxVisibleToasts !== void 0 ? _options_maxVisibleToasts : Infinity;
        this.wrapUpdate = options === null || options === void 0 ? void 0 : options.wrapUpdate;
    }
}
class $4175972a06e8c575$var$Timer {
    reset(delay) {
        this.remaining = delay;
        this.resume();
    }
    pause() {
        if (this.timerId == null) return;
        clearTimeout(this.timerId);
        this.timerId = null;
        this.remaining -= Date.now() - this.startTime;
    }
    resume() {
        if (this.remaining <= 0) return;
        this.startTime = Date.now();
        this.timerId = setTimeout(()=>{
            this.timerId = null;
            this.remaining = 0;
            this.callback();
        }, this.remaining);
    }
    constructor(callback, delay){
        this.startTime = null;
        this.remaining = delay;
        this.callback = callback;
    }
}


export {$4175972a06e8c575$export$c7b26b20d3ced9c5 as useToastState, $4175972a06e8c575$export$f1f8569633bbbec4 as ToastQueue, $4175972a06e8c575$export$84726ef35ca2129a as useToastQueue};
//# sourceMappingURL=useToastState.js.map
