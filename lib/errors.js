'use strict'

/**
 * DuplicatedAction class
 */
class DuplicatedAction extends Error {
  /**
   * Create a new DuplicatedAction
   * @param {String} action The name of the action already registered
   * @constructs DuplicatedAction
   */
  constructor (action) {
    let message = `The action ${action} is already registered`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'DA01'
  }
}

/**
 * ConflictingGlobal class
 */
class ConflictingGlobal extends Error {
  /**
   * Create a new ConflictingGlobal
   * @param {String} action The name of the action that have conflicting global values
   * @param {String} conflictingAction the name of the second conflicting action
   * @constructs ConflictingGlobal
   */
  constructor (action, conflictingAction) {
    let message = `The action ${action} is trying to register global rules that conflics with ${conflictingAction}`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'CA01'
  }
}

/**
 * RoutingFailed class
 */
class RoutingFailed extends Error {
  /**
   * Create a new RoutingFailed
   * @param {String} id The request's id that failed to be routed
   * @param {String} type The request's type
   * @constructs RoutingFailed
   */
  constructor (id, type) {
    let message = `Unable to route request ${id} with type ${type}`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'RF01'
  }
}

/**
 * InvalidCertificateUri class
 */
class InvalidCertificateUri extends Error {
  /**
   * Create a new InvalidCertificateUri
   * @param {String} uri The invalid certificate's URI
   * @constructs InvalidCertificateUri
   */
  constructor (uri) {
    let message = `Unable to valid the certificate's URI as a valid Amazon URI: ${uri}`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'IC01'
  }
}

/**
 * InvalidCertificate class
 */
class InvalidCertificate extends Error {
  /**
   * Create a new InvalidCertificate
   * @constructs InvalidCertificate
   */
  constructor () {
    let message = 'Unable to validate a signature certificate'
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'IC02'
  }
}

/**
 * InvalidSignature class
 */
class InvalidSignature extends Error {
  /**
   * Create a new InvalidSignature
   * @constructs InvalidSignature
   */
  constructor () {
    let message = 'Unable to validate a signature'
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'IS00'
  }
}

/**
 * ExpiredRequest class
 */
class ExpiredRequest extends Error {
  /**
   * Create a new ExpiredRequest
   * @constructs ExpiredRequest
   */
  constructor () {
    let message = 'Unable to handle a request because the timestamp expired'
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'ER01'
  }
}

/**
 * InvalidApplicationId class
 */
class InvalidApplicationId extends Error {
  /**
   * Create a new InvalidApplicationId
   * @constructs InvalidApplicationId
   */
  constructor () {
    let message = 'Unable to handle a request because of an invalid application ID'
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'IA01'
  }
}

/**
 * ValidationError class
 */
class ValidationError extends Error {
  /**
   * Create a new ValidationError
   * @param {Error} joiError A Joi error object that will be converted to ValidationError
   * @constructs ValidationError
   */
  constructor (joiError) {
    super(joiError.message)

    this.name = this.constructor.name
    this.message = joiError.message
    this.stack = joiError.stack
    this.isJoi = true
    this.details = joiError.details
    this.annotate = joiError.annotate
    this.code = 'VE01'
  }
}

module.exports = {
  DuplicatedAction,
  ConflictingGlobal,
  RoutingFailed,
  ValidationError,
  InvalidCertificateUri,
  InvalidCertificate,
  InvalidSignature,
  ExpiredRequest,
  InvalidApplicationId
}
