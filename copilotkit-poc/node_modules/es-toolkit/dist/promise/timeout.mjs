import { TimeoutError } from "../error/TimeoutError.mjs";
import { delay } from "./delay.mjs";
//#region src/promise/timeout.ts
/**
* Returns a promise that rejects with a `TimeoutError` after a specified delay.
*
* @param ms - The delay duration in milliseconds.
* @returns A promise that rejects with a `TimeoutError` after the specified delay.
* @throws {TimeoutError} Throws a `TimeoutError` after the specified delay.
*
* @example
* try {
*   await timeout(1000); // Timeout exception after 1 second
* } catch (error) {
*   console.error(error); // Will log 'The operation was timed out'
* }
*/
async function timeout(ms) {
	await delay(ms);
	throw new TimeoutError();
}
//#endregion
export { timeout };
