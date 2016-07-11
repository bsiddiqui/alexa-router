'use strict'

/**
 * Handles an incoming Alexa's request
 */
class Request {
  /**
   * @constructs Request
   * @param {Object} alexaRequest A plain object representing an Alexa's request
   */
  constructor (alexaRequest) {
    this.raw = alexaRequest

    this.type = alexaRequest.request.type
    this.id = alexaRequest.request.id
    this.timestamp = new Date(alexaRequest.request.timestamp)

    // Parse session information
    this._parseSession()

    // Parse the request according to the type
    if (alexaRequest.request.type === 'IntentRequest') {
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
    this.type = 'intent'
    this.intent = {
      name: this.raw.request.intent.name,
      slots: {}
    }

    for (let slot in this.raw.request.intent.slots) {
      this.intent.slots[slot.name] = slot.value
    }
  }
}

module.exports = Request
