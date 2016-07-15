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
   * @param {Router} router An instantiated Router instance
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
      this.intent.slots[slot] = this.raw.request.intent.slots[slot].value
    }
  }

  /**
   * Creates a new response based on the current reply
   * @param {Any} patchRaw Merged with the raw response object
   * @return {Response} A Response instance
   */
  response (patchRaw) {
    return new Response(this, patchRaw)
  }

  /**
   * Returns the next flow for this request
   * @return {Object} An object containing a valid next flow
   */
  next () {
    return this.session.attributes['alexa-router-next']
      ? JSON.parse(this.session.attributes['alexa-router-next'])
      : undefined
  }
}

module.exports = Request
