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
   */
  constructor (config) {
    this.config = _.defaults({ routeIntentOnly: true }, config)
    this.actions = {}
    this.events = {
      received: [],
      replying: []
    }
  }

  plugin (plugin, config) {
    plugin.call(plugin, this, config)
  }

  on (event, handler, config) {
    helpers.checkUnknownEvent(this, event)

    let defaults = _.defaults({ weigth: 100 }, config)
    this.events[event].push({ handler, config: defaults })
  }

  off (handler, event) {
    if (event) {
      helpers.checkUnknownEvent(this, event)
      _.remove(this.events[event], { handler })
    } else {
      Object.keys(this.events).forEach(event => {
        this.off(handler, event)
      })
    }
  }

  action (name, config) {
    helpers.checkDuplicatedAction(this, name)

    config = Joi.attempt(config, Joi.object({
      handler: Joi.func().required(),
      auto: Joi.object({
        type: Joi.only('launch', 'intent', 'sessionEnded', 'unexpected').required(),
        intent: Joi.when('type', {
          is: 'intent',
          then: Joi.string().required(),
          otherwise: Joi.forbidden()
        })
      }).optional()
    }))

    config.name = name
    helpers.checkConflictingAuto(this, config)
    this.actions[name] = config
  }

  dispatch (alexaData) {
    return new Promise((resolve, reject) => {
      let request = new Request(alexaData, this)

      if (this.config.routeIntentOnly && request.type !== 'intent') {
        return resolve({})
      }

      let action = this.actionDiscovery(request)

      return Promise.resolve(action()).then(resolve, reject)
    })
  }

  actionDiscovery (request) {
    let flow = request.session.attributes['alexa-router-flow']
      ? JSON.parse(request.session.attributes['alexa-router-flow'])
      : undefined

    if (flow) {
      let action = _.find(flow, {
        type: request.type,
        intent: _.get(request, ['intent', 'name'])
      })

      if (action) {
        return this.actions[action.action].handler.bind(null, request, action.params)
      } else {
        let unexpected = _.find(flow, { type: 'unexpected' })

        if (unexpected) {
          return this.actions[unexpected.action].handler.bind(null, request, unexpected.params)
        } else {
          let unexpected = _.find(this.actions, {
            auto: { type: 'unexpected' }
          })

          if (unexpected) {
            return unexpected.handler.bind(null, request)
          }
        }
      }
    }

    let action = _.find(this.actions, {
      auto: {
        type: request.type,
        intent: _.get(request, ['intent', 'name'])
      }
    }, _.find(this.actions, {
      auto: { type: 'unexpected' }
    }))

    if (action) {
      return action.handler.bind(null, request)
    } else {
      throw new errors.RoutingFailed(request.id, request.type)
    }
  }
}

module.exports = AlexaRouter
