//#region src/types/utility.d.ts
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredBy<T, K extends keyof T> = T & { [P in K]-?: T[P] };
//#endregion
export { PartialBy, RequiredBy };
//# sourceMappingURL=utility.d.mts.map