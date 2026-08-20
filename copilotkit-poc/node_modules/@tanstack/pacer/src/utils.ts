import type { AnyFunction } from './types'

export function isFunction<T extends AnyFunction>(value: any): value is T {
  return typeof value === 'function'
}

export function parseFunctionOrValue<T, TArgs extends Array<any>>(
  value: T | ((...args: TArgs) => T),
  ...args: TArgs
): T {
  return isFunction(value) ? value(...args) : value
}
