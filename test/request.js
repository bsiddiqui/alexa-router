'use strict'

let lab = exports.lab = require('lab').script()
let expect = require('code').expect

let Alexa = require('../')
let Request = require('../lib/request')
let fixtures = require('./fixtures')

lab.experiment('request', () => {
  lab.test('should parse session even if there is no attributes', (cb) => {
    let incoming = fixtures.HELLO_WORLD_REQUEST
    delete incoming.session.attributes

    let request = new Request(incoming, new Alexa.Router())
    expect(request.session.attributes).to.be.equal({})

    cb()
  })

  lab.test('should correctly parse slots', (cb) => {
    let incoming = fixtures.HELLO_WORLD_REQUEST

    let request = new Request(incoming, new Alexa.Router())
    expect(request.intent.slots.Hello).to.be.equal('world')

    cb()
  })
})
