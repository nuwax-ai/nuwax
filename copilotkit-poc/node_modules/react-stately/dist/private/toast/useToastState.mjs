import {useMemo as $3oMuY$useMemo, useCallback as $3oMuY$useCallback} from "react";
import {useSyncExternalStore as $3oMuY$useSyncExternalStore} from "use-sync-external-store/shim/index.js";

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

function $ac6ee1e83ff78022$export$c7b26b20d3ced9c5(props = {}) {
    let { maxVisibleToasts: maxVisibleToasts = 1, wrapUpdate: wrapUpdate } = props;
    let queue = (0, $3oMuY$useMemo)(()=>new $ac6ee1e83ff78022$export$f1f8569633bbbec4({
            maxVisibleToasts: maxVisibleToasts,
            wrapUpdate: wrapUpdate
        }), [
        maxVisibleToasts,
        wrapUpdate
    ]);
    return $ac6ee1e83ff78022$export$84726ef35ca2129a(queue);
}
function $ac6ee1e83ff78022$export$84726ef35ca2129a(queue) {
    let subscribe = (0, $3oMuY$useCallback)((fn)=>queue.subscribe(fn), [
        queue
    ]);
    let getSnapshot = (0, $3oMuY$useCallback)(()=>queue.visibleToasts, [
        queue
    ]);
    let visibleToasts = (0, $3oMuY$useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
    return {
        visibleToasts: visibleToasts,
        add: (content, options)=>queue.add(content, options),
        close: (key)=>queue.close(key),
        pauseAll: ()=>queue.pauseAll(),
        resumeAll: ()=>queue.resumeAll()
    };
}
class $ac6ee1e83ff78022$export$f1f8569633bbbec4 {
    constructor(options){
        this.queue = [];
        this.subscriptions = new Set();
        /** The currently visible toasts. */ this.visibleToasts = [];
        this.maxVisibleToasts = options?.maxVisibleToasts ?? Infinity;
        this.wrapUpdate = options?.wrapUpdate;
    }
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
            timer: options.timeout ? new $ac6ee1e83ff78022$var$Timer(()=>this.close(toastKey), options.timeout) : undefined
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
            this.queue[index].onClose?.();
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
}
class $ac6ee1e83ff78022$var$Timer {
    constructor(callback, delay){
        this.startTime = null;
        this.remaining = delay;
        this.callback = callback;
    }
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
}


export {$ac6ee1e83ff78022$export$c7b26b20d3ced9c5 as useToastState, $ac6ee1e83ff78022$export$f1f8569633bbbec4 as ToastQueue, $ac6ee1e83ff78022$export$84726ef35ca2129a as useToastQueue};
//# sourceMappingURL=useToastState.mjs.map
