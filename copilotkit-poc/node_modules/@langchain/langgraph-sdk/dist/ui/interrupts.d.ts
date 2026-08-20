import { Interrupt, ThreadState } from "../schema.js";

//#region src/ui/interrupts.d.ts
/**
 * Normalizes HITL interrupt payloads to expose camelCase fields plus deprecated
 * snake_case aliases for compatibility during migration.
 */
declare function normalizeInterruptForClient<T = unknown>(interrupt: Interrupt<T>): Interrupt<T>;
/**
 * Applies {@link normalizeInterruptForClient} to each interrupt.
 */
declare function normalizeInterruptsList<T = unknown>(interrupts: Interrupt<T>[]): Interrupt<T>[];
declare function userFacingInterruptsFromValuesArray<InterruptType = unknown>(valueInterrupts: Interrupt<InterruptType>[]): Interrupt<InterruptType>[];
declare function userFacingInterruptsFromThreadTasks<InterruptType = unknown>(allInterrupts: Interrupt<InterruptType>[]): Interrupt<InterruptType>[] | null;
declare function extractInterrupts<InterruptType = unknown>(values: unknown, options?: {
  isLoading: boolean;
  threadState: ThreadState | undefined;
  error: unknown;
}): Interrupt<InterruptType> | undefined;
//#endregion
export { extractInterrupts, normalizeInterruptForClient, normalizeInterruptsList, userFacingInterruptsFromThreadTasks, userFacingInterruptsFromValuesArray };
//# sourceMappingURL=interrupts.d.ts.map