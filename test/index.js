'use strict'

let assert = require('assert')

let AlexaRouter = require('../')
let alexa = new AlexaRouter()

let examples = {
  sayHello: {
    version: '1.0',
    session: {
      new: true,
      sessionId: 'this-should-be-an-id',
      application: {
        applicationId: 'weird-id-wuh?'
      },
      attributes: {},
      user: {
        userId: 'this-is-an-id'
      }
    },
    request: {
      type: 'IntentRequest',
      requestId: 'another-id',
      timestamp: new Date().toJSON(),
      intent: {
        name: 'say-hello',
        slots: {}
      }
    }
  },
  ok: {
    version: '1.0',
    session: {
      new: true,
      sessionId: 'this-should-be-an-id',
      application: {
        applicationId: 'weird-id-wuh?'
      },
      attributes: {
        referrer: '/say-hello'
      },
      user: {
        userId: 'this-is-an-id'
      }
    },
    request: {
      type: 'IntentRequest',
      requestId: 'another-id',
      timestamp: new Date().toJSON(),
      intent: {
        name: 'ok',
        slots: {}
      }
    }
  }
}

alexa.route('/say-hello', (request, response) => {
  response.speech('<say>Hello world!</say>')
})

alexa.route('/say-hello/ok', (request, response) => {
  response.speech('Ok then, it worked')
  response.endSession(true)
})

alexa.dispatch(examples.sayHello)
.then((res) => {
  let json = res.toJSON()
  assert.equal(json.response.outputSpeach.type, 'SSML')
  assert.equal(json.response.outputSpeach.ssml, '<say>Hello world!</say>')

  return alexa.dispatch(examples.ok)
})
.then((res) => {
  let json = res.toJSON()
  assert.equal(json.response.outputSpeach.type, 'PlainText')
  assert.equal(json.response.outputSpeach.ssml, 'Ok then, it worked')
  assert.equal(json.response.shouldEndSession, true)
})
