'use strict'

/**
 * RouteConflictError class
 */
exports.RouteConflictError = class RouteConflictErro extends Error {
  /**
   * Create a new RouteConflictError
   * @param {String} route The route that's conflicting
   * @constructs RouteConflicError
   */
  constructor (route) {
    let message = `The route ${route} has been declared more than one time`
    super(message)

    this.name = this.constructor.name
    this.message = message
  }
}
