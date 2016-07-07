'use strict'

let _ = require('lodash')

/**
 * Manipulates an Alexa's compatible reply
 */
class Response {
  /**
   * Instantiates a new Response
   * @param {Object} patchInitialRaw Overrides the default raw reply
   */
  constructor (patchInitialRaw) {
    this.raw = _.merge({
      version: '1.0',
      response: { shouldEndSession: false }
    }, patchInitialRaw)
  }

  /**
   * Detects if a text has SSML tags in it
   * @param {String} text The text to be analyzed
   * @return {Boolean}
   * @private
   */
  _isSSML (text) {
    return text.match(/<(.|\n)*?>/g)
  }

  /**
   * Sets, patches or retrieve the session's attributes
   * @param {String|Object} [key] If a string is present and value is also present
   * then it will set a single key into the session. If only the key is present
   * and it's a string then the key's value will be returned. If the key is an
   * object then it will be merged into the session. If neither the key nor the
   * value is present then the whole session will be returned
   * @param {String} [value] The value for the desired attributed
   * @return {String|Object} An string if only the key is defined and is a string
   * or an object representing the whole session if neither the key nor the value
   * are present
   */
  session (key, value) {
    if (typeof key === 'object') {
      this.raw.sessionAttributes = _.merge(this.raw.sessionAttributes, key)
    } else if (typeof key === 'string' && !value) {
      return this.raw.sessionAttributes[key]
    } else if (typeof key === 'string' && value) {
      this.raw.sessionAttributes[key] = value
    } else if (typeof key === 'undefined' && typeof value === 'undefined') {
      return this.raw.sessionAttributes
    }
  }

  /**
   * Setups the output speech and automatically detects SSML
   * @param {String} text The text that Alexa will say to the user
   */
  speech (text) {
    if (text) {
      _.unset(this.raw.response, 'outputSpeach')
      _.unset(this.raw.response, 'reprompt')

      this.raw.response.outputSpeach = this._isSSML(text)
        ? { type: 'SSML', ssml: text }
        : { type: 'PlainText', text }
    } else {
      return this.raw.response.outputSpeach
        ? this.raw.response.outputSpeach.ssml || this.raw.response.outputSpeach.text
        : undefined
    }
  }

  /**
   * Makes another question to the user and automatically detects SSML
   * @param {String} text The text that Alexa will say to the user
   */
  reprompt (text) {
    if (text) {
      _.unset(this.raw.response, 'outputSpeach')
      _.unset(this.raw.response, 'reprompt')

      this.raw.response.reprompt = this._isSSML(text)
        ? { type: 'SSML', ssml: text }
        : { type: 'PlainText', text }
    } else {
      return this.raw.response.reprompt
        ? this.raw.response.reprompt.ssml || this.raw.response.reprompt.text
        : undefined
    }
  }

  /**
   * Sets the card attribute or returns
   * @param {Object} [card] An Alexa's response compatible card object
   * @return {Object} Returns the whole card object if the card param isn't present
   */
  card (card) {
    if (card) {
      _.unset(this.raw.response, 'card')
      this.raw.response.card = card
    } else {
      return this.raw.response.card
    }
  }

  /**
   * Clears the whole session data
   */
  clearSession () {
    this.raw.sessionAttributes = {}
  }

  /**
   * Sets or returns the shouldEndSession attribute
   * @param {Boolean} [shouldEndSession]
   * @return {Boolean}
   */
  endSession (shouldEndSession) {
    if (typeof shouldEndSession === 'boolean') {
      this.raw.response.shouldEndSession = shouldEndSession
    } else {
      return this.raw.response.shouldEndSession
    }
  }

  /**
   * Overrides the default toJSON attribute to return only the raw response
   * @return {Object} The raw response
   */
  toJSON () {
    return this.raw
  }
}

module.exports = Response
