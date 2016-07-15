'use strict'

let _ = require('lodash')

let Request = require('../lib/request')
let Alexa = require('../')

const HELLO_WORLD_REQUEST = {
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
      name: 'HELLO_WORLD',
      slots: {
        Hello: {
          name: 'Hello',
          value: 'world'
        }
      }
    }
  }
}

const LAUNCH_REQUEST = {
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
    type: 'LaunchRequest',
    requestId: 'this-is-a-launch-request',
    timestamp: new Date().toJSON()
  }
}

function simpleRouting () {
  let alexa = new Alexa.Router()
  alexa.action('hello-world', {
    handler: (request) => {
      let response = request.response()
      response.speech('Hello world!')

      return response
    },
    global: {
      type: 'intent',
      intent: 'HELLO_WORLD'
    }
  })

  return alexa
}

function twoRoutes () {
  let alexa = simpleRouting()
  alexa.action('second-route', {
    handler: (request) => {
      let response = request.response()
      response.speech('Hello from second route')

      return response
    }
  })

  return alexa
}

function twoRoutesAndUnexpected () {
  let alexa = twoRoutes()
  alexa.action('unexpected', {
    handler: (request) => {
      let response = request.response()
      response.speech('This was unexpected')

      return response
    }
  })

  return alexa
}

function simpleRequest () {
  let alexa = simpleRouting()
  let request = new Request(HELLO_WORLD_REQUEST, alexa)

  return request
}

function simpleResponse () {
  return simpleRequest().response()
}

function addNextToRequest (obj, next) {
  return _.merge(obj, {
    session: {
      attributes: { 'alexa-router-next': JSON.stringify(next) }
    }
  })
}

module.exports = {
  twoRoutesAndUnexpected,
  simpleRouting,
  twoRoutes,
  addNextToRequest,
  simpleRequest,
  simpleResponse,
  HELLO_WORLD_REQUEST,
  LAUNCH_REQUEST
}
