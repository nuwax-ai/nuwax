# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

thread-stream is a library for streaming data to a Node.js Worker Thread. It uses SharedArrayBuffer and Atomics for efficient inter-thread communication, enabling high-performance data streaming to worker threads.

## Build & Test Commands

```bash
npm test                    # Run linting (standard), type checking, and all tests
npm run build               # Type check only (tsc --noEmit)
npm run test:ci             # CI-specific test run

# Run a single test file
node --test test/<filename>.test.js
node --test test/<filename>.test.ts  # For TypeScript tests

# Lint
npx standard
```

## Architecture

### Core Components

- **index.js**: Main `ThreadStream` class extending EventEmitter. Manages shared memory buffers, worker lifecycle, and provides stream-like write/flush/end API.

- **lib/worker.js**: Runs inside the Worker Thread. Loads the user-provided destination module, reads from shared buffer, and writes to the destination stream.

- **lib/indexes.js**: Defines shared buffer index constants (`WRITE_INDEX`, `READ_INDEX`) used for Atomics-based synchronization.

- **lib/wait.js**: Provides `wait()` and `waitDiff()` utilities for async waiting on Atomics state changes with exponential backoff.

### Shared Memory Communication

The main thread and worker communicate via two SharedArrayBuffers:
1. **stateBuf**: Int32Array for READ_INDEX and WRITE_INDEX positions
2. **dataBuf**: Buffer for actual string data (default 4MB)

Write flow: Main thread writes to dataBuf, updates WRITE_INDEX, worker reads data between READ_INDEX and WRITE_INDEX, updates READ_INDEX when consumed.

### Worker Module Interface

User-provided worker modules must export an async function that receives `workerData` and returns a writable stream:

```js
async function run(opts) {
  const stream = fs.createWriteStream(opts.dest)
  await once(stream, 'open')
  return stream
}
module.exports = run
```

### Sync vs Async Modes

- `sync: true`: Blocking writes using flushSync, waits for worker to consume
- `sync: false` (default): Non-blocking writes with drain events when buffer fills

## Code Style

Uses [Standard](https://standardjs.com/) for linting. Test files in `test/ts/**/*` and `test/syntax-error.mjs` are excluded from linting.
