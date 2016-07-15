'use strict'

let _ = require('lodash')
let Joi = require('joi')

let helpers = require('./helpers')
let Request = require('./request')
let errors = require('./errors')

/**
 * The main AlexaRouter class
 */
class AlexaRouter {
  /**
   * Instantiates AlexaRouter and creates an empty routing table
   * @constructs AlexaRouter
   * @param {Object} [config]
   * @param {Boolean} [config.routeIntentOnly=true] Only deal with intent requests
   */
  constructor (config) {
    this.config = _.defaults(config, { routeIntentOnly: true })
    this.actions = {}
  }

  /**
   * Registers a new action into the router
   * @param {String} name The action's name
   * @param {Object} config
   * @param {Function} config.handler The main handler of the action
   * @param {Object} [config.global] Additional global configurations
   * @param {String} [config.global.type] The global type to be matched
   * @param {String} [config.global.intent] The intent name if any
   * @return {[type]} [description]
   */
  action (name, config) {
    helpers.checkDuplicatedAction(this, name)

    config = helpers.validate(config, Joi.object({
      handler: Joi.func().required(),
      global: Joi.object({
        type: Joi.only('launch', 'intent', 'sessionEnded', 'unexpected').required(),
        intent: Joi.when('type', {
          is: 'intent',
          then: Joi.string().required(),
          otherwise: Joi.forbidden()
        })
      }).optional()
    }))

    config.name = name
    helpers.checkConflictingGlobal(this, config)
    this.actions[name] = config
  }

  /**
   * Dispatches an Alexa request through the router
   * @param {Object} alexaData A valid Alexa request
   * @return {Promise(Response)} A promise that resolves to a Response instance
   */
  dispatch (alexaData) {
    return new Promise((resolve, reject) => {
      let request = new Request(alexaData, this)

      if (this.config.routeIntentOnly && request.type !== 'intent') {
        return resolve({})
      }

      let action = this._actionDiscovery(request)

      return Promise.resolve(action()).then(resolve, reject)
    })
  }

  /**
   * Detects which action should be triggered
   * @private
   * @param {Request} request A Request instance
   * @return {Function} An handler ready to be executed
   * @throws {RoutingFailed} If not able to route a request
   */
  _actionDiscovery (request) {
    let next = request.next()

    if (next) {
      let search = { type: request.type }

      if (request.type === 'intent') {
        search.intent = request.intent.name
      }

      let action = _.find(next, search)

      if (action) {
        return this.actions[action.action].handler.bind(null, request, action.params)
      } else {
        let unexpected = _.find(next, { type: 'unexpected' })

        if (unexpected) {
          return this.actions[unexpected.action].handler.bind(null, request, unexpected.params)
        } else {
          let unexpected = _.find(this.actions, {
            global: { type: 'unexpected' }
          })

          if (unexpected) {
            return unexpected.handler.bind(null, request)
          }
        }
      }
    }

    let search = {
      global: { type: request.type }
    }

    if (request.type === 'intent') {
      search.global.intent = request.intent.name
    }

    let action = _.find(this.actions, search) || _.find(this.actions, {
      global: { type: 'unexpected' }
    })

    if (action) {
      return action.handler.bind(null, request)
    } else {
      throw new errors.RoutingFailed(request.id, request.type)
    }
  }
}

module.exports = AlexaRouter
