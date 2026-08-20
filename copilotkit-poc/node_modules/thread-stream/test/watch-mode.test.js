'use strict'

const { test } = require('tap')
const { join } = require('path')
const ThreadStream = require('..')

test('ignores worker messages without a protocol code', function (t) {
  t.plan(2)

  const stream = new ThreadStream({
    filename: join(__dirname, 'message-without-code.js'),
    sync: false
  })

  const errors = []
  stream.on('error', err => {
    errors.push(err)
  })

  stream.on('ready', () => {
    t.ok(stream.write('hello world\n'))
    stream.end()
  })

  stream.on('finish', () => {
    t.same(errors, [])
  })
})
