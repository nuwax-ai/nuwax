export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
export declare function mod(amount: number, numerator: number): number;
