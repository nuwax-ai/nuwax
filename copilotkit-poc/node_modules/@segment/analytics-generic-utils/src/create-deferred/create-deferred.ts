/**
 * Return a promise that can be externally resolved
 */
export const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason: any) => void
  let settled = false
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = (...args) => {
      settled = true
      _resolve(...args)
    }
    reject = (...args) => {
      settled = true
      _reject(...args)
    }
  })

  return {
    resolve,
    reject,
    promise,
    isSettled: () => settled,
  }
}
