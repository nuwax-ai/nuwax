import { RefObject } from '@react-types/shared';
export declare function useFormReset<T>(ref: RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null> | undefined, initialValue: T, onReset: (value: T) => void): void;
