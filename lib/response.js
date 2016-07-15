'use strict'

let _ = require('lodash')
let Joi = require('joi')
let helpers = require('./helpers')

/**
 * Manipulates an Alexa's compatible reply
 */
class Response {
  /**
   * Instantiates a new Response
   * @param {Request} request An instance of Request
   * @param {Object} patchRaw Overrides the default raw reply
   */
  constructor (request, patchRaw) {
    this.request = request
    this.raw = _.merge({
      version: '1.0',
      response: { shouldEndSession: false },
      sessionAttributes: {}
    }, patchRaw)
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
    } else if (typeof key === 'string' && typeof value === 'undefined') {
      return this.raw.sessionAttributes[key]
    } else if (typeof key === 'string' && typeof value !== 'undefined') {
      this.raw.sessionAttributes[key] = value
    } else {
      return this.raw.sessionAttributes
    }
  }

  /**
   * Setups the output speech and automatically detects SSML
   * @param {String} text The text that Alexa will say to the user
   * @return {Object} An object with the speech if the parameter is undefined
   */
  speech (text) {
    if (text) {
      // Unset all conflicting keys for precaution
      _.unset(this.raw.response, 'outputSpeech')
      _.unset(this.raw.response, 'reprompt')

      // Check if the speech is in the SSML format
      this.raw.response.outputSpeech = this._isSSML(text)
        ? { type: 'SSML', ssml: text }
        : { type: 'PlainText', text }
    } else {
      // The callee just want to retrieve the speech
      return this.raw.response.outputSpeech
        ? this.raw.response.outputSpeech.ssml || this.raw.response.outputSpeech.text
        : undefined
    }
  }

  /**
   * Makes another question to the user and automatically detects SSML
   * @param {String} text The text that Alexa will say to the user
   * @return {Object} An object with the reprompt speech if the parameter is undefined
   */
  reprompt (text) {
    if (text) {
      // Unset all conflicting keys for precaution
      _.unset(this.raw.response, 'outputSpeech')
      _.unset(this.raw.response, 'reprompt')

      // Detects SSML
      this.raw.response.reprompt = this._isSSML(text)
        ? { type: 'SSML', ssml: text }
        : { type: 'PlainText', text }
    } else {
      // The callee only wants to know the reprompt
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
      // Unset any previous card
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
   * Configures the next flow
   * @param {Object[]} config An object with a flow to be inserted
   */
  next (config) {
    // Load any previously added next flow
    let next = this.session('alexa-router-next')
      ? JSON.parse(this.session('alexa-router-next'))
      : []

    if (Array.isArray(config)) {
      config.forEach(config => this.next(config))
    } else {
      config = helpers.validate(config, Joi.object({
        type: Joi.only('intent', 'sessionEnded', 'launch', 'unexpected').required(),
        intent: Joi.when('type', {
          is: 'intent',
          then: Joi.string().required(),
          otherwise: Joi.forbidden()
        }),
        action: Joi.only(Object.keys(this.request.router.actions)).required(),
        params: Joi.any().optional()
      }))

      next.push(config)
      this.session('alexa-router-next', JSON.stringify(next))
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
