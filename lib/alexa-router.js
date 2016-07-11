'use strict'

let path = require('path')
let _ = require('lodash')

let errors = require('./errors')
let Request = require('./request')
let Response = require('./response')

/**
 * The main AlexaFramework class
 */
class AlexaFramework {
  /**
   * Instantiates AlexaFramework and creates an empty routing table
   * @constructs AlexaFrameword
   */
  constructor () {
    this.routes = {}
  }

  /**
   * Add a new route and handler
   * @param {String} path The URL that need to be matched
   * @param {Function} handler A function that will be triggered when a match occurs
   * @throws {RouteConflicError} If the path is already registered
   */
  route (path, handler) {
    if (this.routes[path]) {
      throw new errors.RouteConflictError(path)
    } else {
      this.routes[path] = handler
    }
  }

  alias (alias, path) {
    if (!this.routes[path]) {
      throw new errors.UnknownRoute(path)
    } else {
      this.routes[alias] = this.routes[path]
    }
  }

  /**
   * Dispatch an Alexa's request trough the routing mechanism
   * @param {Object} alexaData An object compatible with an Alexa's request
   * @return {Promise} A promise that resolves to a Response
   */
  dispatch (alexaData) {
    let request = new Request(alexaData)

    if (request.type === 'intent') {
      let url = request.session.attributes.referrer || '/'
      url = path.join(url, request.intent.name)

      if (this.routes[url]) {
        let response = new Response({
          sessionAttributes: _.merge(request.session.attributes, { referrer: url })
        })

        return Promise.resolve(
          this.routes[url].call(this.routes[url], request, response)
        )
        .then(() => response)
      } else {
        console.log('Missing 404 implementation for routes. Tried: %s', url)
      }
    } else {
      console.log('Missing non-intent request implementation')
    }
  }
}

module.exports = AlexaFramework
