'use strict'

let _ = require('lodash')
let fs = require('fs')

let Request = require('../../lib/request')
let Alexa = require('../../')

const VALID_CERL_URL = 'https://s3.amazonaws.com:443/echo.api/echo-api-cert-3.pem'
const VALID_CERT = fs.readFileSync(`${__dirname}/cert.pem`)
const VALID_SIGNATURE = 'LH3fBYo1umEiy2RATVEh2ivYn2q0mf4Uo3O1tSrQ1JCx+wqo2ka9jlfD7TlQpYLv8r4c2Zloq8cWmOOPnXLeT67EtOJDIagRrOwGdD32zpCo0J+r5ub96Kyswj5doik2NkHyyAGlhHa7kaSCkKFhYzqtrOCeo1MmAM6T42aqBIiG4JokWeFtIM+CMrlyLZDlJemoZF+sXq6+Aw9MBQhyE/6Q6xvA34/KF1vHf3xP7vZaAQUrFWp2VFUksadh2fcOEi/VgZ9K7E+5rjNrst5aoo/OEPbRPmDKvR0pXEZfXkoMS38c+JdF7LCfrHIkUgn9FgxOhB11w0McLKoUT3Ik4w=='
const VALID_PAYLOAD = '{"version":"1.0","session":{"new":true,"sessionId":"amzn1.echo-api.session.3c8786c0-0d71-47f5-a626-5336cf2765cc","application":{"applicationId":"amzn1.echo-sdk-ams.app.bcfc07ca-e320-4b73-a51d-9edbac414b0e"},"user":{"userId":"amzn1.ask.account.AFP3ZWPOS2BGJR7OWJZ3DHPKMOMNWY4AY66FUR7ILBWANIHQN73QHEYH2QN46NAGHGQIIXC2RJRCUTS7GTJ3B2ZKEKGXZSK7DDXWQJLRGGK334E7HSGSCQHIKHSDQQDPNR4GEJ4AC4AYMU7FWNLOLCW3N6NOJAPMUFODKBDOAD4TZBIXI77NZBWEBWUDWEEKI6MRSSHIXUDT5UQ","accessToken":"RZJzlZIpAtR9EX1zoVwHu1rI68mqSp"}},"request":{"type":"IntentRequest","requestId":"amzn1.echo-api.request.a7bde749-d35c-4179-b530-f0f3e6677211","timestamp":"2016-07-18T20:50:02Z","locale":"en-US","intent":{"name":"EmailsList"}}}'

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
  let alexa = new Alexa.Router({
    appId: 'hello-world',
    verifySignature: false,
    verifyTimestamp: false,
    verifyApplicationId: false
  })

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
  LAUNCH_REQUEST,
  VALID_CERL_URL,
  VALID_CERT,
  VALID_SIGNATURE,
  VALID_PAYLOAD
}
