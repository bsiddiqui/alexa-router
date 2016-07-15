'use strict'

let lab = exports.lab = require('lab').script()
let expect = require('code').expect

let Alexa = require('../')
let fixtures = require('./fixtures')

lab.describe('router', () => {
  lab.test('should correctly register an action', (cb) => {
    let alexa = new Alexa.Router()
    let action = {
      handler: () => {},
      global: { type: 'intent', intent: 'AMAZON.YesIntent' }
    }

    alexa.action('test', action)
    expect(Object.keys(alexa.actions)).to.have.length(1)
    expect(alexa.actions.test).to.contain({
      name: 'test',
      global: action.global
    })

    expect(alexa.actions.test.handler).to.be.a.function()

    cb()
  })

  lab.test('should be able to override defaults', (cb) => {
    let alexa = new Alexa.Router({ routeIntentOnly: false })
    expect(alexa.config.routeIntentOnly).to.be.false()

    cb()
  })

  lab.test('should not allow route override', (cb) => {
    let alexa = new Alexa.Router()
    let action = {
      handler: () => {},
      global: { type: 'intent', intent: 'AMAZON.YesIntent' }
    }

    alexa.action('test', action)

    expect(() => alexa.action('test', action)).to.throw(Alexa.errors.DuplicatedAction)
    expect(() => alexa.action('hello-world', action)).to.throw(Alexa.errors.ConflictingGlobal)

    cb()
  })

  lab.test('should throw when not configured properly', (cb) => {
    let alexa = new Alexa.Router()
    let action = {
      handler: () => {},
      global: { type: 'intent' }
    }

    expect(() => alexa.action('test', action)).to.throw(Alexa.errors.ValidationError)
    cb()
  })

  lab.test('should correctly dispatch', () => {
    let alexa = fixtures.simpleRouting()

    return alexa.dispatch(fixtures.HELLO_WORLD_REQUEST)
    .then(res => {
      let json = res.toJSON()
      expect(json.response.outputSpeech.text).to.equal('Hello world!')
    })
  })

  lab.test('should route to global unexpected when no intent matched', () => {
    let alexa = fixtures.simpleRouting()
    delete alexa.actions['hello-world']

    alexa.action('unexpected', {
      handler: (request) => {
        let response = request.response()
        response.endSession(true)

        return response
      },
      global: { type: 'unexpected' }
    })

    return alexa.dispatch(fixtures.HELLO_WORLD_REQUEST)
    .then(res => {
      let json = res.toJSON()
      expect(json.response.shouldEndSession).to.be.true()
    })
  })

  lab.test('should throw when no route matches', () => {
    let alexa = fixtures.simpleRouting()
    delete alexa.actions['hello-world']

    let error

    return alexa.dispatch(fixtures.HELLO_WORLD_REQUEST)
    .catch(err => { error = err })
    .then(() => expect(error).to.be.instanceof(Alexa.errors.RoutingFailed))
  })

  lab.test('should only route intents when configured', () => {
    let alexa = fixtures.simpleRouting()

    return alexa.dispatch(fixtures.LAUNCH_REQUEST)
    .then(res => {
      expect(res).to.equal({})

      alexa.config.routeIntentOnly = false

      alexa.action('launch-action', {
        handler: (request) => {
          let response = request.response()
          response.endSession(true)

          return response
        },
        global: { type: 'launch' }
      })

      return alexa.dispatch(fixtures.LAUNCH_REQUEST)
    })
    .then(res => {
      let json = res.toJSON()
      expect(json.response.shouldEndSession).to.be.true()
    })
  })

  lab.test('should respect the next flow when matching routes', (cb) => {
    let alexa = fixtures.twoRoutes()

    let incoming = fixtures.addNextToRequest(
      fixtures.HELLO_WORLD_REQUEST,
      [{ type: 'intent', intent: 'HELLO_WORLD', action: 'second-route' }]
    )

    return alexa.dispatch(incoming)
    .then(res => {
      let json = res.toJSON()
      expect(json.response.outputSpeech.text).to.equal('Hello from second route')
    })
  })

  lab.test('should route to unexpected next', (cb) => {
    let alexa = fixtures.twoRoutesAndUnexpected()
    alexa.config.routeIntentOnly = false

    let incoming = fixtures.addNextToRequest(
      fixtures.LAUNCH_REQUEST,
      [{ type: 'unexpected', action: 'unexpected' }]
    )

    return alexa.dispatch(incoming)
    .then(res => {
      let json = res.toJSON()
      expect(json.response.outputSpeech.text).to.equal('This was unexpected')
    })
  })

  lab.test('should route to global unexpected when no matches and no unexpected inside the next', (cb) => {
    let alexa = fixtures.twoRoutesAndUnexpected()
    alexa.config.routeIntentOnly = false
    alexa.actions.unexpected.global = { type: 'unexpected' }

    let incoming = fixtures.addNextToRequest(
      fixtures.LAUNCH_REQUEST,
      [{ type: 'intent', intent: 'HELLO_WORLD', action: 'second-route' }]
    )

    return alexa.dispatch(incoming)
    .then(res => {
      let json = res.toJSON()
      expect(json.response.outputSpeech.text).to.equal('This was unexpected')
    })
  })

  lab.test('should throw when no unexpected in global or in the next', (cb) => {
    let error
    let alexa = fixtures.twoRoutes()
    let incoming = fixtures.addNextToRequest(
      fixtures.HELLO_WORLD_REQUEST,
      [{ type: 'intent', intent: 'DO_NOT_EXISTS', action: 'wont-exists' }]
    )

    incoming.request.intent.name = 'HERE_BE_DRAGONS'

    return alexa.dispatch(incoming)
    .catch(err => { error = err })
    .then(() => expect(error).to.be.instanceof(Alexa.errors.RoutingFailed))
  })
})
