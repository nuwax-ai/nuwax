import { Dispatch } from 'react';
type SetValueAction<S> = (prev: S) => Generator<any, void, unknown>;
export declare function useValueEffect<S>(defaultValue: S | (() => S)): [S, Dispatch<SetValueAction<S>>];
export {};
