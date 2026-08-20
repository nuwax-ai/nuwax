# Changelog
## repeater@3.1.0 - 2026-06-07
This release flattens the monorepo into a single package, adds explicit resource
management, and migrates the build to [`@b9g/libuild`](https://github.com/bikeshaving/libuild).
**It is non-breaking for the common case:** if you only `import { Repeater } from
"@repeaterjs/repeater"`, nothing changes. The breaking-sounding items below only
affect code that imported the separate `@repeaterjs/timers` / `@repeaterjs/limiters`
packages, which are now folded in and renamed.

### Added
- **Subpath entry points.** In addition to the default export you can now import
  narrower surfaces:
  - `@repeaterjs/repeater/core` — the `Repeater` class and buffers only, without
    the static combinators (smaller when you don't need race/merge/zip/latest).
  - `@repeaterjs/repeater/combinators` — `race`, `merge`, `zip`, `latest` as plain
    functions (the same logic backing `Repeater.race` etc.).
  - `@repeaterjs/repeater/timers` — `createDelay`, `createInterval`, `createTimeout`.
  - `@repeaterjs/repeater/limiters` — `createSemaphore`, `createThrottle`.
- **Explicit Resource Management.** `Repeater` now implements `Symbol.asyncDispose`
  and `Symbol.dispose` (both call `return()`), so `await using` / `using` clean up
  the repeater on scope exit. The handlers are installed defensively and are no-ops
  on runtimes that lack the symbols.
- Dual ESM + CJS output with an `exports` map for every entry point.

### Changed
- `@repeaterjs/timers` and `@repeaterjs/limiters` are now part of this package, and
  their helpers gained a `create` prefix: `delay` → `createDelay`, `interval` →
  `createInterval`, `timeout` → `createTimeout`, `semaphore` → `createSemaphore`,
  `throttle` → `createThrottle`.
- The combinators were rewritten to race against the stop promise with a memory-safe
  `Promise.race` alternative (replacing the previous `Promise.race` work-arounds).
  Behavior is unchanged.

### Deprecated
- The standalone `@repeaterjs/timers`, `@repeaterjs/limiters`, `@repeaterjs/pubsub`,
  and `@repeaterjs/react-hooks` packages are deprecated on npm. `timers` and
  `limiters` are replaced by the subpath exports above; `pubsub` and `react-hooks`
  are not carried forward.

### Migration
- Default `import { Repeater } from "@repeaterjs/repeater"` users: no action needed.
- `@repeaterjs/timers` / `@repeaterjs/limiters` users: switch the import to
  `@repeaterjs/repeater/timers` / `/limiters` and add the `create` prefix to the
  helper names.

## repeater@3.0.6 - 2024-05-08
- Fix promise returned from `push` function not resolving when using a buffer.
## repeater@3.0.5 - 2023-11-07
### Fixed
- Add export maps to package.json files for the TypeScript `nodenext`
## repeater@3.0.4 - 2020-09-02
### Fixed
- Fixed memory leaks in static combinator functions race, merge, zip and latest due to Promise.race.
## repeater@3.0.3 - 2020-08-03
### Fixed
- Fixed missing file in package.json.
## repeater@3.0.2 - 2020-08-03
### Fixed
- Fixed throw method not catching promises in newer versions of v8 (node.js 12+).
- Added ESM support for newer versions of node.
## limiters@0.3.3 - 2019-10-13
### Fixed
- build files with target set to es5 rather than esnext
## timers@0.3.3 2019-11-10
### Fixed
- build files with target set to es5 rather than esnext
## pubsub@0.3.4 2019-11-10
### Fixed
- build files with target set to es5 rather than esnext
## repeater@3.0.1 2019-11-10
### Fixed
- build files with target set to es5 rather than esnext
## limiters@0.3.2 - 2019-10-13
### Changed
- upgrade dependencies
## timers@0.3.2 - 2019-10-13
### Changed
- upgrade dependencies
## pubsub@0.3.3 - 2019-10-13
### Changed
- upgrade dependencies
## repeater@3.0.0 2019-11-10
This release overhauls the `push` and `stop` promises and the `return` and `throw` methods to be more in line with the behavior of async generators. If you used repeaters to simply add and remove event handlers, you can upgrade without worrying about breaking changes. However, if you awaited `push` calls, read the value of the `stop` promise, or used the `return` or `throw` methods in non-trivial ways, this release may break your code.

### Changed
- Previously, the n-th call to `push` resolved to the value passed to the n-th call to `Repeater.prototype.next`. This was inaccurate insofar as async generators resume the n-th `yield` with the value passed to the n+1-th call to `next`. Additionally, async generators completely ignore the first value passed to `next` entirely. The former behavior of repeaters was confusing insofar as the first call to `push` would always resolve immediately, because `push` could not be called until `next` was called for the first time. In 3.0, the behavior has now been changed so that the n-th call to `push` resolves to the n+1-th call to `next`.

  For the most part, code which awaits `push` will work as expected, except when the code relied on the first call to `push` resolving immediately. To make sure you’re not relying on the old behavior of `push`, you should make sure that you await push at the bottom of loops, rather than the top. [See the changes to `timers`](https://github.com/repeaterjs/repeater/pull/37/files#diff-3a96d0916b4599004af38c4a0cedb249L94-R113) as an example.

- Calling `Repeater.prototype.throw` will now cause the previous `push` call to reject, rather than simply stopping the repeater and throwing the error. This means errors thrown into repeaters are now recoverable. If you call push without awaiting or calling `then/catch` on the returned promise and then call the `throw` method, the repeater will rethrow the error, preserving the previous behavior. However, if you await `push` or otherwise call the `then` or `catch` methods, it becomes your responsibility to handle errors thrown in via `throw` and stop the repeater. [#43](https://github.com/repeaterjs/repeater/pull/43)

- The `stop` promise no longer resolves to the value passed to `Repeater.prototype.return`. Instead, it consistently fulfills to `undefined` when the repeater is stopped. Additionally, calling `Repeater.prototype.return` will return a result whose value is always whatever was passed to `return`. In the case of premature returns, the return value of the executor is ignored unless it throws an error. [#41](https://github.com/repeaterjs/repeater/pull/41)

  This change was made because there is no way with async generators to inspect the value passed to return from within the async generator. Additionally, the only way to modify the result returned from the `return` method would be to put a `return` statement in a `finally` block within the async generator, which is typically considered to be a bad practice. Repeaters now uniformly return the value passed to the `return` method. See [#40](https://github.com/repeaterjs/repeater/issues/40) for a longer explanation for why we made this change.

- Errors thrown by the executor now take priority over rejections passed to push. If a pushed promise rejects, the repeater will await the execution result and throw an error thrown by the executor instead of the rejected promise.

- Changes to combinator methods
  - Improved type inference for `Repeater.race` and `Repeater.merge`
  - `Repeater.merge` yields non-iterable values, so you can call merge on an iterable of promises to get an async iterator which produces values as each promise fulfills.
  - Iterables passed to combinator methods are upgraded to async iterators, so that promise-like values are awaited and unwrapped before being pushed to the repeater

- Changes to typescript typings:
  - `Repeater`, `RepeaterExecutor`, `Push` and other related types now take the type parameters `TReturn` and `TNext` in line with typescript 3.6’s strict async generator typings.
  - The `RepeaterBuffer` interface and concrete classes no longer accept a type parameter. All places where the type parameter would have been used, `unknown` is used instead. You should never directly add or remove values from buffers.
  - The typings of the `next` and `return` methods have been changed to accept `PromiseLike<T>` and `PromiseLike<TReturn>` respectively as parameters.
## pubsub@0.3.2 - 2019-10-13
### Fixed
- Fixed build error in @repeaterjs/pubsub
## timers@0.3.1 - 2019-06-29
### Fixed
- Fixed timers using the wrong version of @repeaterjs/repeater
## limiters@0.3.1 - 2019-06-29
### Fixed
- Fixed limiters using the wrong version of @repeaterjs/repeater
## pubsub@0.3.1 - 2019-06-29
### Fixed
- Fixed pubsub using the wrong version of @repeaterjs/repeater.
## timers@0.3.0 - 2019-08-24
### Changed
- Renamed all instances of `Channel` to `Repeater` (e.g. `Channel` to `Repeater`, `ChannelBuffer` to `RepeaterBuffer`). See [#18](https://github.com/repeaterjs/repeater/issues/18) for the rationale behind this name change.
## limiters@0.3.0 - 2019-08-24
### Changed
- Renamed all instances of `Channel` to `Repeater` (e.g. `Channel` to `Repeater`, `ChannelBuffer` to `RepeaterBuffer`). See [#18](https://github.com/repeaterjs/repeater/issues/18) for the rationale behind this name change.
## pubsub@0.3.0 - 2019-08-24
### Changed
- Renamed all instances of `Channel` to `Repeater` (e.g. `Channel` to `Repeater`, `ChannelBuffer` to `RepeaterBuffer`). See [#18](https://github.com/repeaterjs/repeater/issues/18) for the rationale behind this name change.
## repeater@2.0.0 - 2019-08-24
### Changed
- Renamed all instances of `Channel` to `Repeater` (e.g. `Channel` to `Repeater`, `ChannelBuffer` to `RepeaterBuffer`). See [#18](https://github.com/repeaterjs/repeater/issues/18) for the rationale behind this name change.
## timers@0.2.1 - 2019-06-09
- Fixed timers using the wrong version of @channel/channel.
## limiters@0.2.1 - 2019-06-09
- Fixed limiters using the wrong version of @channel/channel.
## pubsub@0.2.1 - 2019-06-09
### Fixed
- Fixed pubsub using the wrong version of @channel/channel.
## channel@1.0.0 - 2019-06-09
### Added
- The `Channel` class now exposes the static methods `Channel.race`, `Channel.merge`, `Channel.zip` and `Channel.latest` [#4](https://github.com/repeaterjs/repeater/issues/4).
### Changed
- The `close` and `stop` arguments passed to executor have been merged as the second argument.
- The `stop` promise resolves to argument passed to `return` if `return` is called.
- The `push` function now resolves to the value passed to next.
- The `push` function now unwraps promise-like values passed to push.
- Buffers now throw an error if `remove` is called when the buffer is empty.
- Channel properties and methods which don’t belong to the async iterator interface are now hidden using a private WeakMap.
- Channels stop immediately when the executor throws an error.
- Executor now runs synchronously when `next` is called for the first time (#10).
- The final iteration result/errors are now consumed by iterator methods.
- `return`/`throw` behave more like the methods do for `async generators`.
## timers@0.2.0 - 2019-06-09
### Changed
- `delay` now returns an channel which can be reused
- `timeout` returns a channel
## limiters@0.2.0 - 2019-06-09
### Added
- throttler can now be passed a `cooldown` boolean option which forces the channel to wait before yielding the final token.
### Changed
- semaphore and throttler now both return channels rather than async iterators.
- throttler function now takes options instead of a number representing limit as the second arg.
- semaphore and throttler will throw a RangeError if limit is less than 1.
### Fixed
- throttler now uses a sliding window to limit [#1](https://github.com/repeaterjs/repeater/issues/1).
## pubsub@0.2.0 - 2019-06-09
### Changed
- Type definitions have changed slightly.
## channel@0.1.1 - 2019-05-06
### Added
- Adds throw method to channels.
## timers@0.1.1 - 2019-04-08
## limiters@0.1.1 - 2019-04-08
## pubsub@0.1.1 - 2019-04-08
## channel@0.1.0 - 2019-04-08
- Initial release.
## timers@0.1.0 - 2019-04-08
- Initial release.
## limiters@0.1.0 - 2019-04-08
- Initial release.
## pubsub@0.1.0 - 2019-04-08
- Initial release.
