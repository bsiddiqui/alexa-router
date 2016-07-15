'use strict'

let lab = exports.lab = require('lab').script()
let expect = require('code').expect

let Alexa = require('../')
let Request = require('../lib/request')
let Response = require('../lib/response')
let fixtures = require('./fixtures')

lab.experiment('response', () => {
  lab.test('should correctly add session', (cb) => {
    let res = fixtures.simpleResponse()

    res.session('hello', 'world')
    expect(res.session('hello')).to.equal('world')
    expect(res.session()).to.equal({ hello: 'world' })

    res.session({ hello: 'world2' })
    expect(res.session('hello')).to.equal('world2')

    res.clearSession()
    expect(res.session()).to.equal({})

    cb()
  })

  lab.test('should correctly add speech', (cb) => {
    let res = fixtures.simpleResponse()

    expect(res.speech()).to.be.undefined()

    res.speech('hello world')
    expect(res.speech()).to.equal('hello world')

    res.speech('<speak>hello world</speak>')
    expect(res.speech()).to.equal('<speak>hello world</speak>')
    expect(res.raw.response.outputSpeech.type).to.equal('SSML')

    cb()
  })

  lab.test('should correctly add reprompt', (cb) => {
    let res = fixtures.simpleResponse()

    expect(res.reprompt()).to.be.undefined()

    res.reprompt('hello world')
    expect(res.reprompt()).to.equal('hello world')

    res.reprompt('<speak>hello world</speak>')
    expect(res.reprompt()).to.equal('<speak>hello world</speak>')
    expect(res.raw.response.reprompt.type).to.equal('SSML')

    cb()
  })

  lab.test('should correctly add card', (cb) => {
    let res = fixtures.simpleResponse()

    res.card({ type: 'LinkAccount' })
    expect(res.card()).to.equal({ type: 'LinkAccount' })

    cb()
  })

  lab.test('should correctly end session', (cb) => {
    let res = fixtures.simpleResponse()

    res.endSession(true)
    expect(res.endSession()).to.equal(true)

    cb()
  })

  lab.test('should correctly add the next flow', (cb) => {
    let alexa = fixtures.twoRoutesAndUnexpected()
    let request = new Request(fixtures.HELLO_WORLD_REQUEST, alexa)
    let res = new Response(request)

    res.next({ type: 'unexpected', action: 'unexpected' })
    res.next([
      { type: 'intent', intent: 'HELLO_WORD', action: 'hello-world' },
      { type: 'intent', intent: 'SECOND_HELLO', action: 'second-route' }
    ])

    expect(JSON.parse(res.session('alexa-router-next'))).to.have.length(3)
    expect(() => res.next({ type: 'nonono' })).to.throw(Alexa.errors.ValidationError)

    cb()
  })
})
