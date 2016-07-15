'use strict'

let lab = exports.lab = require('lab').script()
let expect = require('code').expect

let helpers = require('../lib/helpers')

lab.experiment('helpers', () => {
  lab.test('should correctly map type names', (cb) => {
    let convert = helpers.alexaTypeToRouterType

    expect(convert('LaunchRequest')).to.equal('launch')
    expect(convert('SessionEndedRequest')).to.equal('sessionEnded')
    expect(convert('IntentRequest')).to.equal('intent')
    expect(convert('non-existent')).to.equal('unexpected')

    cb()
  })
})
