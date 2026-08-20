const require_TimeoutError = require("../error/TimeoutError.js");
const require_delay = require("./delay.js");
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
	await require_delay.delay(ms);
	throw new require_TimeoutError.TimeoutError();
}
//#endregion
exports.timeout = timeout;
