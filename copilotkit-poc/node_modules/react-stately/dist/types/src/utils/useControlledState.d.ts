import { SetStateAction } from 'react';
export declare function useControlledState<T, C = T>(value: Exclude<T, undefined>, defaultValue: Exclude<T, undefined> | undefined, onChange?: (v: C, ...args: any[]) => void): [T, (value: SetStateAction<T>, ...args: any[]) => void];
export declare function useControlledState<T, C = T>(value: Exclude<T, undefined> | undefined, defaultValue: Exclude<T, undefined>, onChange?: (v: C, ...args: any[]) => void): [T, (value: SetStateAction<T>, ...args: any[]) => void];
