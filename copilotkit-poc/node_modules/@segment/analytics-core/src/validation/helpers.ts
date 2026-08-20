export function isString(obj: unknown): obj is string {
  return typeof obj === 'string'
}

export function isNumber(obj: unknown): obj is number {
  return typeof obj === 'number'
}

export function isFunction(obj: unknown): obj is Function {
  return typeof obj === 'function'
}

export function exists<T>(val: unknown): val is NonNullable<T> {
  return val !== undefined && val !== null
}

export function isPlainObject(
  obj: unknown
): obj is Record<string | symbol | number, unknown> {
  return (
    Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object'
  )
}
