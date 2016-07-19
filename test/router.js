'use strict'

let lab = exports.lab = require('lab').script()
let expect = require('code').expect
let request = require('request-promise')
let co = require('co')

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
    let alexa = new Alexa.Router({
      routeIntentOnly: false,
      appId: 'hello-world'
    })

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

  lab.test('should throw trying to retrieve a certificate from a malicious source', co.wrap(function * () {
    let alexa = fixtures.simpleRouting()
    let errors = yield {
      one: alexa._retrieveCertificate('http://malicious.com').catch(err => err),
      two: alexa._retrieveCertificate('https://malicious.com').catch(err => err),
      three: alexa._retrieveCertificate('https://s3.amazonaws.com/malicious').catch(err => err),
      four: alexa._retrieveCertificate('https://s3.amazonaws.com:666/echo.api/valid').catch(err => err),
      five: alexa._retrieveCertificate('https://s3.amazonaws.com/echo.api/valid').catch(err => err),
      six: alexa._retrieveCertificate(fixtures.VALID_CERL_URL).catch(err => err)
    }

    expect(errors.one).to.be.instanceof(Alexa.errors.InvalidCertificateUri)
    expect(errors.two).to.be.instanceof(Alexa.errors.InvalidCertificateUri)
    expect(errors.three).to.be.instanceof(Alexa.errors.InvalidCertificateUri)
    expect(errors.four).to.be.instanceof(Alexa.errors.InvalidCertificateUri)
    expect(errors.five).to.not.be.instanceof(Alexa.errors.InvalidCertificateUri)
    expect(errors.six).to.equal(yield request(fixtures.VALID_CERL_URL))
  }))

  lab.test('should cache certificates', co.wrap(function * () {
    let alexa = fixtures.simpleRouting()
    alexa.certs['hello-world'] = Promise.resolve('Hello world!')

    expect(yield alexa._retrieveCertificate('hello-world')).to.equal('Hello world!')
  }))

  lab.test('should throw for invalid certificates', co.wrap(function * () {
    let alexa = fixtures.simpleRouting()
    expect(() => alexa._checkCert('not-a-valid-cert')).to.throw(Alexa.errors.InvalidCertificate)
  }))

  lab.test('should throw for expired requests', co.wrap(function * () {
    let alexa = fixtures.simpleRouting()
    alexa.config.verifyTimestamp = true

    expect(() => alexa._checkTimestamp({
      request: { timestamp: new Date(new Date().getTime() - 16 * 1000) }
    })).to.throw(Alexa.errors.ExpiredRequest)

    expect(() => alexa._checkTimestamp({
      request: { timestamp: new Date() }
    })).to.not.throw()

    alexa.config.verifyTimestamp = false

    expect(() => alexa._checkTimestamp({
      request: { timestamp: new Date(new Date().getTime() - 16 * 1000) }
    })).to.not.throw()
  }))

  lab.test('should check application id', co.wrap(function * () {
    let alexa = fixtures.simpleRouting()
    alexa.config.verifyApplicationId = true

    expect(() => alexa._checkAppId({
      session: {
        application: { applicationId: 'not-my-app' }
      }
    })).to.throw(Alexa.errors.InvalidApplicationId)

    expect(() => alexa._checkAppId({
      session: {
        application: { applicationId: 'hello-world' }
      }
    })).to.not.throw()

    alexa.config.verifyApplicationId = false

    expect(() => alexa._checkAppId({
      session: {
        application: { applicationId: 'not-my-app' }
      }
    })).to.not.throw()
  }))

  lab.test('should validate signature', co.wrap(function * () {
    let alexa = fixtures.simpleRouting()
    alexa.config.verifySignature = true
    alexa.certs[fixtures.VALID_CERL_URL] = Promise.resolve(fixtures.VALID_CERT)

    let errors = yield {
      one: alexa._checkSignature(JSON.parse(fixtures.VALID_PAYLOAD), {
        signature: fixtures.VALID_SIGNATURE,
        signaturecertchainurl: fixtures.VALID_CERL_URL
      }).catch(err => err),
      two: alexa._checkSignature(JSON.parse(fixtures.VALID_PAYLOAD), {
        signature: fixtures.VALID_SIGNATURE.substring(1),
        signaturecertchainurl: fixtures.VALID_CERL_URL
      }).catch(err => err)
    }

    expect(errors.one).to.be.undefined()
    expect(errors.two).to.be.instanceof(Alexa.errors.InvalidSignature)
  }))
})
