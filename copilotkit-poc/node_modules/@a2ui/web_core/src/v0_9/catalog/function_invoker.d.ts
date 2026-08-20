import { DataContext } from '../rendering/data-context.js';
/**
 * A function that invokes a catalog function by name and returns its result synchronously or as a Signal.
 *
 * @param name The name of the function to invoke.
 * @param args The arguments to pass to the function.
 * @param context The data context in which the function is being executed.
 * @param abortSignal An optional AbortSignal for asynchronous or long-running operations.
 * @returns The result of the function call, which can be a literal, a Signal, or a Promise (handled by the caller).
 */
export type FunctionInvoker = (name: string, args: Record<string, any>, context: DataContext, abortSignal?: AbortSignal) => any;
//# sourceMappingURL=function_invoker.d.ts.map