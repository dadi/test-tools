const assert = require('assert').strict

function deserialise(_, value) {
  if (
    Array.isArray(value) &&
    value.length === 3 &&
    value[0] === '<<REGEXP_' &&
    value[2] === '_REGEXP>>'
  ) {
    const [_, exp, flags] = value[1].match(/\/(.*)\/(.*)?/)

    return new RegExp(exp, flags || '')
  }

  return value
}

function isId(input) {
  if (typeof input !== 'string') {
    return false
  }

  return new RegExp(
    '([a-f0-9]{24}|[a-f0-9]{32}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})'
  ).test(input)
}

function isObject(input) {
  return input && input.toString() === '[object Object]'
}

function areEqual(left, right, ids, looseResultSearch) {
  if (left === right) {
    return true
  }

  if (isId(left) && isId(right)) {
    ids[left] = right

    return true
  }

  if (Boolean(left) !== Boolean(right) || typeof left !== typeof right) {
    return false
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false
    }

    if (
      left.every((_, index) =>
        areEqual(left[index], right[index], ids, looseResultSearch)
      )
    ) {
      return true
    }

    if (looseResultSearch) {
      return left.every(leftItem => {
        return right.find(rightItem =>
          areEqual(leftItem, rightItem, ids, false)
        )
      })
    }

    return false
  }

  if (isObject(left) && isObject(right)) {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)

    if (leftKeys.length !== rightKeys.length) {
      return false
    }

    return leftKeys.every(key => {
      if (areEqual(left[key], right[key], ids, looseResultSearch)) {
        return true
      }

      if (ids[key] && right[ids[key]]) {
        return areEqual(left[key], right[ids[key]], ids, looseResultSearch)
      }

      return false
    })
  }

  return false
}

function processFile(filePath, tests, testDelay, instance, ids) {
  describe(filePath, () => {
    tests.forEach(test => {
      processTest(test.test, test.ops, testDelay, instance, ids)
    })
  })
}

function processOp(op, testDelay, instance, ids) {
  const opData = JSON.parse(op)

  if (typeof instance[opData.t] !== 'function') {
    return
  }

  it(opData.t, function(done) {
    const regex = new RegExp(`(${Object.keys(ids).join('|')})`, 'g')

    if (opData.a) {
      const search = JSON.stringify(opData.a)
      const replaced = search.replace(regex, match => {
        return ids[match] || match
      })

      opData.a = JSON.parse(replaced, deserialise)
    }

    const { a: args, e: shouldThrow, r: expected, t: type } = opData

    Promise.resolve(instance[type].apply(instance, args))
      .then(received => {
        if (shouldThrow) {
          return done(new Error('Op should throw'))
        }

        if (
          expected !== undefined &&
          !areEqual(expected, received, ids, Boolean(opData.looseResultSearch))
        ) {
          assert.deepStrictEqual(received, expected)
        }

        setTimeout(done, testDelay)
      })
      .catch(err => {
        setTimeout(() => {
          done(shouldThrow ? null : err)
        }, testDelay)
      })
  })
}

function processTest(name, ops, testDelay, instance, ids) {
  describe(name, () => {
    ops.forEach(op => {
      processOp(op, testDelay, instance, ids)
    })
  })
}

module.exports = ({ Connector, script, testDelay = 5 }) => () => {
  const lines = script.split('\n')
  const ids = {}
  const instance = new Connector()
  const tests = []

  let currentFile
  let currentTest

  lines.forEach(line => {
    if (line.indexOf('#') === 0) {
      currentFile = {
        file: line.slice(1),
        tests: []
      }

      tests.push(currentFile)
    } else if (line.indexOf('>') === 0 && currentFile) {
      currentTest = {
        ops: [],
        test: line.slice(1)
      }

      currentFile.tests.push(currentTest)
    } else {
      if (currentTest) {
        currentTest.ops.push(line)
      } else {
        tests.push(line)
      }
    }
  })

  tests.forEach(test => {
    if (typeof test === 'string') {
      processOp(test, testDelay, instance, ids)
    } else if (typeof test.file === 'string') {
      processFile(test.file, test.tests, testDelay, instance, ids)
    } else if (typeof test.test === 'string') {
      processTest(test.test, test.ops, testDelay, instance, ids)
    }
  })
}
