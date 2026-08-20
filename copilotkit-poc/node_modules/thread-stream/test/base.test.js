'use strict'

const { test } = require('tap')
const { join } = require('path')
const { readFile } = require('fs')
const { file } = require('./helper')
const ThreadStream = require('..')
const { MessageChannel } = require('worker_threads')
const { once } = require('events')

function readFileAsync (path) {
  return new Promise((resolve, reject) => {
    readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

test('base sync=true', async function (t) {
  const dest = file()
  const stream = new ThreadStream({
    filename: join(__dirname, 'to-file.js'),
    workerData: { dest },
    sync: true
  })

  const finish = once(stream, 'finish')
  const close = once(stream, 'close')

  t.same(stream.writableObjectMode, false)
  t.same(stream.writableFinished, false)
  t.same(stream.closed, false)
  t.same(stream.writableNeedDrain, false)
  t.ok(stream.write('hello world\n'))
  t.ok(stream.write('something else\n'))
  t.ok(stream.writable)

  t.same(stream.writableEnded, false)
  stream.end()
  t.same(stream.writableEnded, true)

  await finish
  t.same(stream.writableFinished, true)

  await close
  t.same(stream.closed, true)
  t.notOk(stream.writable)

  const data = await readFileAsync(dest)
  t.equal(data, 'hello world\nsomething else\n')
})

test('overflow sync=true', async function (t) {
  const dest = file()
  const stream = new ThreadStream({
    bufferSize: 128,
    filename: join(__dirname, 'to-file.js'),
    workerData: { dest },
    sync: true
  })

  const close = once(stream, 'close')
  let count = 0

  function write () {
    if (count++ === 20) {
      stream.end()
      return
    }

    stream.write('aaaaaaaaaa')
    setImmediate(write)
  }

  write()

  await close
  const data = await readFileAsync(dest)
  t.equal(data.length, 200)
})

test('overflow sync=false', async function (t) {
  const dest = file()
  const stream = new ThreadStream({
    bufferSize: 128,
    filename: join(__dirname, 'to-file.js'),
    workerData: { dest },
    sync: false
  })

  const close = once(stream, 'close')
  let count = 0

  t.same(stream.writableNeedDrain, false)

  function write () {
    if (count++ === 20) {
      stream.end()
      return
    }

    if (!stream.write('aaaaaaaaaa')) {
      t.same(stream.writableNeedDrain, true)
    }
    setImmediate(write)
  }

  write()

  stream.on('drain', () => {
    t.same(stream.writableNeedDrain, false)
  })

  await close
  const data = await readFileAsync(dest)
  t.equal(data.length, 200)
})

test('over the bufferSize at startup', function (t) {
  t.plan(5)

  const dest = file()
  const stream = new ThreadStream({
    bufferSize: 10,
    filename: join(__dirname, 'to-file.js'),
    workerData: { dest },
    sync: true
  })

  stream.on('finish', () => {
    readFile(dest, 'utf8', (err, data) => {
      t.error(err)
      t.equal(data, 'hello world\nsomething else\n')
    })
  })

  t.ok(stream.write('hello'))
  t.ok(stream.write(' world\n'))
  t.ok(stream.write('something else\n'))

  stream.end()
})

test('over the bufferSize at startup (async)', function (t) {
  t.plan(5)

  const dest = file()
  const stream = new ThreadStream({
    bufferSize: 10,
    filename: join(__dirname, 'to-file.js'),
    workerData: { dest },
    sync: false
  })

  t.ok(stream.write('hello'))
  t.notOk(stream.write(' world\n'))
  t.notOk(stream.write('something else\n'))

  stream.end()

  stream.on('finish', () => {
    readFile(dest, 'utf8', (err, data) => {
      t.error(err)
      t.equal(data, 'hello world\nsomething else\n')
    })
  })
})

test('flushSync sync=false', function (t) {
  t.plan(2)

  const dest = file()
  const stream = new ThreadStream({
    bufferSize: 128,
    filename: join(__dirname, 'to-file.js'),
    workerData: { dest },
    sync: false
  })

  stream.on('ready', () => {
    for (let count = 0; count < 20; count++) {
      stream.write('aaaaaaaaaa')
    }

    stream.flushSync()
    setImmediate(() => {
      stream.end()
    })
  })

  stream.on('finish', () => {
    readFile(dest, 'utf8', (err, data) => {
      t.error(err)
      t.equal(data.length, 200)
    })
  })
})

test('pass down MessagePorts', async function (t) {
  const { port1, port2 } = new MessageChannel()
  const stream = new ThreadStream({
    filename: join(__dirname, 'port.js'),
    workerData: { port: port1 },
    workerOpts: {
      transferList: [port1]
    },
    sync: false
  })

  t.teardown(() => {
    stream.end()
  })

  t.ok(stream.write('hello world\n'))
  t.ok(stream.write('something else\n'))

  const [strings] = await once(port2, 'message')
  t.equal(strings, 'hello world\nsomething else\n')
})

test('destroy does not error', async function (t) {
  const dest = file()
  const stream = new ThreadStream({
    filename: join(__dirname, 'to-file.js'),
    workerData: { dest },
    sync: false
  })

  stream.on('ready', () => {
    stream.worker.terminate()
  })

  const [err] = await once(stream, 'error')
  t.equal(err.message, 'the worker thread exited')

  await new Promise((resolve) => {
    stream.flush((err) => {
      t.equal(err.message, 'the worker has exited')
      resolve()
    })
  })

  t.doesNotThrow(() => stream.flushSync())
  t.doesNotThrow(() => stream.end())
})

test('syntax error', async function (t) {
  const stream = new ThreadStream({
    filename: join(__dirname, 'syntax-error.mjs')
  })

  const [err] = await once(stream, 'error')
  t.equal(err.message, 'Unexpected end of input')
})
