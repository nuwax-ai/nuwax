/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import type { ReactiveController, ReactiveControllerHost } from '@lit/reactive-element/reactive-controller.js';
export type ControllerConstructor<C extends ReactiveController> = {
    new (...args: Array<any>): C;
};
/**
 * Creates and stores a stateful ReactiveController instance and provides it
 * with a ReactiveControllerHost that drives the controller lifecycle.
 *
 * Use this hook to convert a ReactiveController into a React hook.
 *
 * @param React the React module that provides the base hooks. Must provide
 * `useState` and `useLayoutEffect`.
 * @param createController A function that creates a controller instance. This
 * function is given a ReactControllerHost to pass to the controller. The
 * create function is only called once per component.
 */
export declare const useController: <C extends ReactiveController>(React: typeof window.React, createController: (host: ReactiveControllerHost) => C) => C;
//# sourceMappingURL=use-controller.d.ts.map