'use strict'

/**
 * RouteConflictError class
 */
exports.RouteConflictError = class RouteConflictError extends Error {
  /**
   * Create a new RouteConflictError
   * @param {String} route The route that's conflicting
   * @constructs RouteConflictError
   */
  constructor (route) {
    let message = `The route ${route} has been declared more than one time`
    super(message)

    this.name = this.constructor.name
    this.message = message
  }
}

/**
 * UnknownRoute class
 */
exports.UnknownRoute = class UnknownRoute extends Error {
  /**
   * Create a new UnknownRoute
   * @param {String} route The route doesn't exists
   * @constructs UnknownRoute
   */
  constructor (route) {
    let message = `The route ${route} does not exists`
    super(message)

    this.name = this.constructor.name
    this.message = message
  }
}
