'use strict'

let assert = require('assert')

let Alexa = require('../')
let alexa = new Alexa.Router()

alexa.action('hello-world', {
  handler: (request) => {
    let response = request.response()
    response.speech('Hello world')
    response.flow({
      type: 'intent',
      intent: 'ok',
      action: 'ok',
      params: { config: 'Hey this is an param' }
    })

    return response
  },
  auto: {
    type: 'intent',
    intent: 'hello-world'
  }
})

alexa.action('ok', {
  handler: (request, params) => {
    let response = request.response()
    response.speech('<speak>Hello world!</speak>')

    assert.equal(params.config, 'Hey this is an param')

    return response
  }
})

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
      requestId: 'request-hello-world',
      timestamp: new Date().toJSON(),
      intent: {
        name: 'hello-world',
        slots: {}
      }
    }
  },
  ok: {
    version: '1.0',
    session: {
      new: false,
      sessionId: 'this-should-be-an-id',
      application: {
        applicationId: 'weird-id-wuh?'
      },
      attributes: {
        'alexa-router-flow': '[{"type":"intent","intent":"ok", "action": "ok", "params":{"config":"Hey this is an param"}}]'
      },
      user: {
        userId: 'this-is-an-id'
      }
    },
    request: {
      type: 'IntentRequest',
      requestId: 'request-ok',
      timestamp: new Date().toJSON(),
      intent: {
        name: 'ok',
        slots: {}
      }
    }
  }
}

alexa.dispatch(examples.sayHello)
.then(res => {
  let json = res.toJSON()
  assert.equal(json.response.outputSpeech.type, 'PlainText')
  assert.equal(json.response.outputSpeech.text, 'Hello world')

  return alexa.dispatch(examples.ok)
})
.then(res => {
  let json = res.toJSON()
  assert.equal(json.response.outputSpeech.type, 'SSML')
  assert.equal(json.response.outputSpeech.ssml, '<speak>Hello world!</speak>')
})
.catch(err => {
  console.log(err.stack)
})
