'use strict'

let helpers = require('./helpers')
let Response = require('./response')

/**
 * Handles an incoming Alexa's request
 */
class Request {
  /**
   * @constructs Request
   * @param {Object} alexaRequest A plain object representing an Alexa's request
   */
  constructor (alexaRequest, router) {
    this.raw = alexaRequest
    this.router = router
    this.type = helpers.alexaTypeToRouterType(alexaRequest.request.type)
    this.id = alexaRequest.request.requestId
    this.timestamp = new Date(alexaRequest.request.timestamp)

    // Parse session information
    this._parseSession()

    // Parse the request according to the type
    if (this.type === 'intent') {
      this._parseIntentRequest()
    }
  }

  /**
   * Parses the session information
   * @private
   */
  _parseSession () {
    this.session = {
      id: this.raw.session.id,
      isNew: this.raw.session,
      attributes: this.raw.session.attributes || {}
    }
  }

  /**
   * Parses an Intent request
   * @private
   */
  _parseIntentRequest () {
    this.intent = {
      name: this.raw.request.intent.name,
      slots: {}
    }

    for (let slot in this.raw.request.intent.slots) {
      this.intent.slots[slot.name] = slot.value
    }
  }

  response (patchRaw) {
    return new Response(this, patchRaw)
  }

  flow () {
    return this.session.attributes['alexa-router-flow']
      ? JSON.parse(this.session.attributes['alexa-router-flow'])
      : {}
  }
}

module.exports = Request
