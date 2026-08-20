//#region src/utils/random-id.d.ts
declare function randomId(): string;
declare function randomUUID(): string;
declare function dataToUUID(input: string | object, namespace?: string): string;
declare function isValidUUID(uuid: string): boolean;
//#endregion
export { dataToUUID, isValidUUID, randomId, randomUUID };
//# sourceMappingURL=random-id.d.cts.map