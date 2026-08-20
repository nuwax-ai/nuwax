import { type Constructor } from "./Constructor.js";
/**
Matches a [`class`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
*/
export type ClassType<T extends object = object, Arguments extends unknown[] = any[]> = Constructor<T, Arguments> & {
    prototype: T;
};
